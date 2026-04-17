import express from 'express';
import { getStatus, getQR, sendText } from './whatsapp.js';

export function createServer() {
    const app = express();
    app.use(express.json());

    app.get('/status', (req, res) => {
        res.json(getStatus());
    });

    // Return QR Code
    app.get('/qr', (req, res) => {
        const qr = getQR();
        if(!qr) return res.status(404).json({ error: "no QR (Eiter you are already connected or it is expected.)"});
        res.json({ qr });
    });

    // Send message
    app.post('/send', async (req, res) => {
    const { to, text } = req.body ?? {};
        if (!to || !text) {
            return res.status(400).json({ error: 'to and text required' });
        }
        try {
            const result = await sendText(to, text);
            res.json({ ok: true, ...result });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    });

    return app;
}