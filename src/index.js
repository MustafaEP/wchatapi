import { createServer } from './server.js';
import { sessionManager } from './session-manager.js';

const PORT = process.env.PORT || 3000;

await sessionManager.restoreAll();

// Start HTTP server
createServer().listen(PORT, () => {
  console.log(`API on http://localhost:${PORT}`);
});