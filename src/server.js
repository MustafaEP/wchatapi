import express from 'express';
import { sessionManager } from './session-manager.js';

export function createServer() {
    const app = express();
    app.use(express.json());

    // List all sessions
    app.get('/sessions', (req, res) => {
        res.json(sessionManager.list());
    });

    // Create a new session or start an existing one
    app.post('/sessions/:id/start', async (req, res) => {
        try {
            const session = await sessionManager.create(req.params.id);
            res.json(session.getStatus());
        } catch (err) {
            res.status(err.status || 400).json({ error: err.message });
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


    return app;
}