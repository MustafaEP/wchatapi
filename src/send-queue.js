/**
 * Per-session sequential send queue with inter-message delay.
 * Different sessions run in parallel; same session is serialized.
 */

const DEFAULT_DELAY = Number(process.env.SEND_DELAY_MS) || 1500;

class SessionQueue {
  constructor(delayMs = DEFAULT_DELAY) {
    this.delayMs = delayMs;
    this.chain = Promise.resolve();
    this.lastSentAt = 0;
  }

  enqueue(taskFn) {
    const run = async () => {
      const since = Date.now() - this.lastSentAt;
      if (since < this.delayMs) {
        await new Promise((r) => setTimeout(r, this.delayMs - since));
      }
      try {
        return await taskFn();
      } finally {
        this.lastSentAt = Date.now();
      }
    };
    const result = this.chain.then(run, run);
    this.chain = result.catch(() => {});
    return result;
  }
}

const queues = new Map();

export function enqueueSend(sessionId, taskFn) {
  let q = queues.get(sessionId);
  if (!q) {
    q = new SessionQueue();
    queues.set(sessionId, q);
  }
  return q.enqueue(taskFn);
}
