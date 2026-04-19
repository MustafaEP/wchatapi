/**
 * Send webhooks with timeout in the back
 * Fire-and-forget
 */

const DEFAULT_TIMEOUT_MS = 5000;
const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [1000, 3000, 10000]; // exponential-ish backoff

function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

async function postOnce(url, payload, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return true;
  } finally {
    clearTimeout(timer);
  }
}

/**
* Sending with a retrieval. It returns a promise, but the caller should NOT await. 
* In case of an error, it is silently logged.
*/
export function dispatch(url, event, payload) {
  if (!url) return;

  const body = {
    event,
    timestamp: Date.now(),
    payload,
  };

  (async () => {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        await postOnce(url, body, DEFAULT_TIMEOUT_MS);
        if (attempt > 0) {
          console.log(`[webhook] ${event} → ${url} başarılı (deneme ${attempt + 1})`);
        }
        return;
      } catch (err) {
        const isLast = attempt === MAX_RETRIES;
        console.warn(
          `[webhook] ${event} → ${url} mistake (try ${attempt + 1}/${MAX_RETRIES + 1}): ${err.message}${isLast ? ' - abandoned' : ''}`
        );
        if (isLast) return;
        await sleep(RETRY_DELAYS_MS[attempt]);
      }
    }
  })();
}