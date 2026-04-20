import 'dotenv/config';
import { sessionManager } from './session-manager.js';
import { createServer } from './server.js';

const PORT = process.env.PORT || 3000;

await sessionManager.restoreAll();

const server = createServer().listen(PORT, () => {
    console.log(`API on http://localhost:${PORT}`);
});

async function shutdown(signal) {
    console.log(`\n${signal} recieved, closing...`);
    server.close(() => console.log('HTTP server closed'));

    for (const s of sessionManager.list()) {
        try {
            await sessionManager.get(s.id).stop();
        } catch {}
    }
    console.log('Sessions is closed, exiting');
    process.exit(0);
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
