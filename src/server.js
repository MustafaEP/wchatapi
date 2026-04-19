import express from 'express';
import { sessionManager } from './session-manager.js';
import multer from 'multer';
import mime from 'mime-types';

export function createServer() {
    const app = express();
    app.use(express.json());

    const upload = multer({
        storage: multer.memoryStorage(),
        limits: { fileSize: 64 * 1024 * 1024 }, // 64 MB — WhatsApp limiti
    });

    // List all sessions
    app.get('/sessions', (req, res) => {
        res.json(sessionManager.list());
    });

    // Create a new session (Opsional)
    app.post('/sessions/:id/start', async (req, res) => {
        try {
            const { webhookUrl } = req.body ?? {};
            const session = await sessionManager.create(req.params.id, { webhookUrl });
            res.json(session.getStatus());
        } catch (err) {
            res.status(err.status || 400).json({ error: err.message });
        }
    });

    // Update webhook url
    app.put('/sessions/:id/webhook', (req, res) => {
        try {
            const { url } = req.body ?? {};
            const session = sessionManager.get(req.params.id);
            session.setWebhook(url ?? null);
            res.json({ ok: true, webhookUrl: session.webhookUrl });
        } catch (err) {
            res.status(err.status || 500).json({ error: err.message });
        }
    });

    // Session status
    app.get('/sessions/:id/status', (req, res) => {
        try {
            res.json(sessionManager.get(req.params.id).getStatus());
        } catch (err) {
            res.status(err.status || 500).json({ error: err.message });
        }
    });

    // QR code
    app.get('/sessions/:id/qr', (req, res) => {
        try {
            const qr = sessionManager.get(req.params.id).getQR();
        if (!qr) return res.status(404).json({ error: 'QR yok' });
            res.json({ qr });
        } catch (err) {
            res.status(err.status || 500).json({ error: err.message });
        }
    });

    // Send message
    app.post('/sessions/:id/send', async (req, res) => {
        const { to, text } = req.body ?? {};
        if (!to || !text) return res.status(400).json({ error: 'to ve text zorunlu' });
        try {
            const session = sessionManager.get(req.params.id);
            const result = await session.sendText(to, text);
            res.json({ ok: true, ...result });
        } catch (err) {
            res.status(err.status || 500).json({ error: err.message });
        }
    });

    // Remove session (clear logout + auth)
    app.delete('/sessions/:id', async (req, res) => {
        try {
            await sessionManager.delete(req.params.id);
            res.json({ ok: true });
        } catch (err) {
            res.status(err.status || 500).json({ error: err.message });
        }
    });

    // Send Media — It supports both URL and file uploads.
    app.post('/sessions/:id/send-media', upload.single('file'), async (req, res) => {
        try {
        const session = sessionManager.get(req.params.id);

        const { to, type, caption, filename } = req.body ?? {};
        if (!to || !type) return res.status(400).json({ error: 'to ve type zorunlu' });

        let source, mimetype, finalFilename;
        if (req.file) {
            source = req.file.buffer;
            mimetype = req.file.mimetype;
            finalFilename = filename || req.file.originalname;
        } else if (req.body.source) {
            source = req.body.source; // URL
            mimetype = req.body.mimetype || mime.lookup(source) || undefined;
            finalFilename = filename;
        } else {
            return res.status(400).json({ error: 'Ya dosya upload et ya da source URL ver' });
        }

        const result = await session.sendMedia(to, {
            type,
            source,
            caption,
            filename: finalFilename,
            mimetype,
            ptt: req.body.ptt === 'true' || req.body.ptt === true,
        });
        res.json({ ok: true, ...result });
        } catch (err) {
            res.status(err.status || 500).json({ error: err.message });
        }
    });

    // Download incoming media
    app.get('/sessions/:id/media/:messageId', async (req, res) => {
        try {
            const session = sessionManager.get(req.params.id);
            const { buffer, mediaInfo } = await session.downloadMedia(req.params.messageId);

            res.setHeader('Content-Type', mediaInfo.mimetype || 'application/octet-stream');
            if (mediaInfo.filename) {
                res.setHeader('Content-Disposition', `inline; filename="${mediaInfo.filename}"`);
            }
            res.send(buffer);
        } catch (err) {
            res.status(err.status || 500).json({ error: err.message });
        }
    });

    return app;
}