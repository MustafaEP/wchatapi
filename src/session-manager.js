import fs from 'fs/promises';
import path from 'path';
import { Session } from './session.js';

class SessionManager {
  constructor() {
    this.sessions = new Map(); // id → Session
  }

  /**
    * Automatically starts every session that has a folder under auth_info/ on disk. 
    * To keep old sessions alive when the server restarts.
    */
  async restoreAll() {
    try {
      const entries = await fs.readdir('./auth_info', { withFileTypes: true });
      const ids = entries.filter((e) => e.isDirectory()).map((e) => e.name);
      console.log(`${ids.length} recovering session: ${ids.join(', ') || '(no)'}`);
      for (const id of ids) {
        await this.create(id);
      }
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
      // auth_info does not exist yet, no problem
    }
  }

  async create(id) {
    if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
      throw new Error('Session id can only contain letters, numbers, _ and -');
    }
    if (this.sessions.has(id)) {
      return this.sessions.get(id);
    }
    const session = new Session(id);
    this.sessions.set(id, session);
    await session.start();
    return session;
  }

  get(id) {
    const session = this.sessions.get(id);
    if (!session) {
      const err = new Error(`Session not found: ${id}`);
      err.status = 404;
      throw err;
    }
    return session;
  }

  list() {
    return Array.from(this.sessions.values()).map((s) => s.getStatus());
  }

  async delete(id) {
    const session = this.get(id);
    await session.logout();
    this.sessions.delete(id);
  }
}

// A single instance is shared throughout the entire application.
export const sessionManager = new SessionManager();