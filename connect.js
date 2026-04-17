import { makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } from 'baileys';
import { Boom } from '@hapi/boom';
import pino from 'pino';
import qrcode from 'qrcode-terminal';

async function  start() {
    // Save seesion info in ./auth_info
    const { state, saveCreds } = await useMultiFileAuthState('./auth_info');

    // Get the Whatsapp Web versiion
    const { version, isLatest } = await fetchLatestBaileysVersion();
    console.log(`WA Web Version: ${version.join('.')}, is it up to date?`);

    // Create websocket
    const sock = makeWASocket({
        version,
        auth: state,
        logger: pino({ level: 'silent' }), 
        markOnlineOnConnect: false // Keep receiving notifications on your phone
    });

    // Write the disk if credentials change
    sock.ev.on('creds.update', saveCreds);

    // Listen for connection events
    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
            console.log("\nScan the QR code with your phone:\n");
            qrcode.generate(qr, { small: true });
        }

        if (connection === 'open') {
            console.log("Connected");
        }

        if (connection === 'close') {
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
      const from = msg.key.remoteJid;
      const text =
        msg.message?.conversation ||
        msg.message?.extendedTextMessage?.text ||
        '[metin değil]';
      console.log(`📩 ${from}: ${text}`);
    }
  });
}

start();