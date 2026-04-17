import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from 'baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import fs from 'fs/promises';
import path from 'path';

export class Session {
  constructor(id) {
    this.id = id;
    this.authDir = path.join('./auth_info', id);
    this.sock = null;
    this.qr = null;
    this.state = 'disconnected'; // 'connecting' | 'qr' | 'connected' | 'disconnected' | 'logged_out'
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
      }

      if (connection === 'open') {
        this.qr = null;
        this.state = 'connected';
        console.log(`[${this.id}] Connected`);
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
          '[not text]';
        console.log(`[${this.id}] - ${msg.key.remoteJid}: ${text}`);
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
}