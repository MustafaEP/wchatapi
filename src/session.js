import {
  makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  downloadMediaMessage,
} from 'baileys';
import { Boom } from '@hapi/boom';
import { dispatch } from './webhook-dispatcher.js';
import pino from 'pino';
import fs from 'fs/promises';
import path from 'path';

export class Session {
    constructor(id, options = {}) {
        this.id = id;
        this.authDir = path.join('./auth_info', id);
        this.sock = null;
        this.qr = null;
        this.state = 'disconnected';
        this.webhookUrl = options.webhookUrl ?? null;
        this.mediaMessages = new Map();
        this.MEDIA_CACHE_LIMIT = 500;
    }
    setWebhook(url) {
        this.webhookUrl = url || null;
    }

    _emit(event, payload) {
        dispatch(this.webhookUrl, event, { sessionId: this.id, ...payload });
    }

    async start() {
        if (this.state === 'connecting' || this.state === 'connected') {
            return; 
        }

        // Save session info in ./auth_info
        const { state: authState, saveCreds } = await useMultiFileAuthState(this.authDir);
        // Get the Whatsapp Web version
        const { version } = await fetchLatestBaileysVersion();

        // Create websocket
        this.sock = makeWASocket({
            version,
            auth: authState,
            logger: pino({ level: 'silent' }),
            markOnlineOnConnect: false,
        });

        this.state = 'connecting';

        // Write the disk if credentials change
        this.sock.ev.on('creds.update', saveCreds);

        // Listen for connection events
        this.sock.ev.on('connection.update', (update) => {
            const { connection, lastDisconnect, qr } = update;

            if (qr) {
                this.qr = qr;
                this.state = 'qr';
                console.log(`[${this.id}] QR ready`);
                this._emit('qr', { qr });
                this._emit('session.status', { state: 'qr' });
            }

            if (connection === 'open') {
                this.qr = null;
                this.state = 'connected';
                console.log(`[${this.id}] Connected`);
                this._emit('session.status', { state: 'connected' });
            }

            if (connection === 'close') {
                const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;

                if (statusCode === DisconnectReason.loggedOut) {
                    this.state = 'logged_out';
                    console.log(`[${this.id}] - Log out from telephone, auth is cleaning`);
                    // Delete auth files, if we want to connect again, we need new qr
                    fs.rm(this.authDir, { recursive: true, force: true }).catch(() => {});
                    return;
                }

                this.state = 'disconnected';
                console.log(`[${this.id}] - Break (code=${statusCode}), Reconnecting`);
                this._emit('session.status', { state: 'disconnected', code: statusCode });
                this.start(); // connect again
            }
        });

        // Write the incoming messages to the console
        this.sock.ev.on('messages.upsert', ({ messages, type }) => {
            if (type !== 'notify') return;
            for (const msg of messages) {
                if (msg.key.fromMe) continue;
                
                const text =
                    msg.message?.conversation ||
                    msg.message?.extendedTextMessage?.text ||
                    null;

                const mediaInfo = this._extractMediaInfo(msg);
                if (mediaInfo) {
                    this._cacheMediaMessage(msg.key.id, msg);
                }

                const payload = {
                    id: msg.key.id,
                    from: msg.key.remoteJid,
                    fromMe: Boolean(msg.key.fromMe),
                    timestamp: msg.messageTimestamp,
                    pushName: msg.pushName ?? null,
                    text,
                    media: mediaInfo,
                };

                console.log(`[${this.id}] - ${msg.key.remoteJid}: ${text}`);
                this._emit('message', payload);
            }
        });
        
        this.sock.ev.on('messages.update', (updates) => {
            for (const u of updates) {
                if (typeof u.update?.status === 'undefined') continue;
                // status codes: 1=pending, 2=sent, 3=delivered, 4=read, 5=played
                this._emit('message.ack', {
                    id: u.key.id,
                    to: u.key.remoteJid,
                    status: u.update.status,
                });
            }
        });
      
    }

    async stop() {
        if (this.sock) {
            // not logout, just close the connection (auth is protected)
            this.sock.end(undefined);
            this.sock = null;
        }
        this.state = 'disconnected';
    }

    async logout() {
        if (this.sock && this.state === 'connected') {
            await this.sock.logout(); // Delete the device in Linked Device list on the phone
        }
        this.sock = null;
        this.state = 'logged_out';
        await fs.rm(this.authDir, { recursive: true, force: true }).catch(() => {});
    }

    getStatus() {
        return {
            id: this.id,
            state: this.state,
            hasQR: Boolean(this.qr),
        };
    }

    getQR() {
        return this.qr;
    }

    async sendText(to, text) {
        if (this.state !== 'connected') {
            throw new Error(`Not logged in (state: ${this.state})`);
        }
        const jid = this._toJid(to);
        const result = await this.sock.sendMessage(jid, { text });
        return { id: result.key.id, to: jid };
    }

    _toJid(to) {
        if (to.includes('@')) return to;
        const clean = to.replace(/[^\d]/g, '');
        return `${clean}@s.whatsapp.net`;
    }

    _extractMediaInfo(msg) {
        const m = msg.message;
        if (!m) return null;

        const inner = m.viewOnceMessage?.message || m.viewOnceMessageV2?.message || m;

        const types = [
            ['imageMessage', 'image'],
            ['videoMessage', 'video'],
            ['audioMessage', 'audio'],
            ['documentMessage', 'document'],
            ['stickerMessage', 'sticker'],
        ];

        for (const [key, type] of types) {
            if (inner[key]) {
                const node = inner[key];
                return {
                    type,
                    mimetype: node.mimetype ?? null,
                    size: Number(node.fileLength) || null,
                    caption: node.caption ?? null,
                    filename: node.fileName ?? null,
                    downloadUrl: `/sessions/${this.id}/media/${msg.key.id}`,
                };
            }
        }
        return null;
    }

    _cacheMediaMessage(id, msg) {
        if (this.mediaMessages.size >= this.MEDIA_CACHE_LIMIT) {
            const firstKey = this.mediaMessages.keys().next().value;
            this.mediaMessages.delete(firstKey);
        }
            this.mediaMessages.set(id, msg);
    }

    async downloadMedia(messageId) {
        const msg = this.mediaMessages.get(messageId);
        if (!msg) {
            const err = new Error('Medya bulunamadı veya süresi doldu');
            err.status = 404;
            throw err;
        }
        const buffer = await downloadMediaMessage(msg, 'buffer', {});
        const mediaInfo = this._extractMediaInfo(msg);
        return { buffer, mediaInfo };
    }

    /**
     * Send media.
     * @param {string} to - no or JID
     * @param {object} opts
     * @param {'image'|'video'|'audio'|'document'} opts.type
     * @param {Buffer|string} opts.source - Buffer or URL string
     * @param {string} [opts.caption] - image/video/document for subtitle
     * @param {string} [opts.filename] - name for document
     * @param {string} [opts.mimetype] - MIME for document/audio 
     * @param {boolean} [opts.ptt] -  "voice note" mod for audio
     */
    async sendMedia(to, opts) {
        if (this.state !== 'connected') {
            throw new Error(`Session isn't open (status: ${this.state})`);
        }
        const { type, source, caption, filename, mimetype, ptt } = opts;
        if (!['image', 'video', 'audio', 'document'].includes(type)) {
            throw new Error(`Invalid media type: ${type}`);
        }
        if (!source) throw new Error('Source required (Buffer or URL)');

        const jid = this._toJid(to);

        const media = Buffer.isBuffer(source) ? source : { url: source };

        const content = { [type]: media };
        if (caption && (type === 'image' || type === 'video' || type === 'document')) {
            content.caption = caption;
        }
        if (type === 'document') {
            content.fileName = filename || 'file';
        if (mimetype) content.mimetype = mimetype;
        }
        if (type === 'audio') {
            content.mimetype = mimetype || 'audio/ogg; codecs=opus';
            content.ptt = Boolean(ptt);
        }

        const result = await this.sock.sendMessage(jid, content);
        return { id: result.key.id, to: jid };
    }
}