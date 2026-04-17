import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from 'baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import qrcode from 'qrcode-terminal';

let sock = null;
let currentQR = null;
let connectionState = 'disconnected'; // 'connecting' | 'qr' | 'connected' | 'disconnected'

export async function start() {
    // Save seesion info in ./auth_info
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');

    // Get the Whatsapp Web version
    const { version } = await fetchLatestBaileysVersion();

    // Create websocket
    sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }), 
        markOnlineOnConnect: false // Keep receiving notifications on your phone
    });

    connectionState = 'connecting';

    // Write the disk if credentials change
    sock.ev.on('creds.update', saveCreds);

    // Listen for connection events
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            currentQR = qr;
            connectionState = 'qr';
            console.log("\nQR ready, Give GET /qr \n");
        }

        if (connection === 'open') {
            currentQR = null;
            connectionState = 'connected';
            console.log("Connected");
        }

        if (connection === 'close') {
            connectionState = 'disconnected'
            const statusCode = new Boom(lastDisconnect?.error)?.output?.statusCode;
            const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
            console.log(`Connection lost. Try Again: ${shouldReconnect}`);
            if(shouldReconnect) start();
        }
    });

    // Write the incoming messages to the console
    sock.ev.on('messages.upsert', ({ messages, type }) => {
    if (type !== 'notify') return;
    for (const msg of messages) {
      if (msg.key.fromMe) continue; // Skip own messages
      const text =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        '[not text]';
      console.log(`📩 ${msg.key.remoteJid}: ${text}`);
    }
  });
}

export function getStatus() {
    return {
        state: connectionState,
        hasQR: Boolean(currentQR),
    };
}

export function getQR() {
    return currentQR;
}

/**
 * Convert the phone number to WhatsApp JID format
 * "905551112233" → "905551112233@s.whatsapp.net"
 */

function toJid(to) {
    if(to.includes('@')) return to;
    const clean = to.replace(/[^\d]/g, '');
    return `${clean}@s.whatsapp.net`;
}

export async function sendText(to, text) {
  if (connectionState !== 'connected') {
    throw new Error(`Connection is not open (state: ${connectionState})`);
  }
  const jid = toJid(to);
  const result = await sock.sendMessage(jid, { text });
  return { id: result.key.id, to: jid };
}