import { start } from './whatsapp.js';
import { createServer } from './server.js';

const PORT = process.env.PORT || 3000;

// Establish the WhatsApp connection
start().catch((err) => {
  console.error('WhatsApp başlatma hatası:', err);
  process.exit(1);
});

// Start HTTP server
createServer().listen(PORT, () => {
  console.log(`🚀 API on http://localhost:${PORT}`);
});