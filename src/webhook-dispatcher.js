/**
 * Send webhooks with HMAC signature, timeout, and retry backoff.
 * Fire-and-forget — callers must NOT await dispatch().
 */

import crypto from 'crypto';

const DEFAULT_TIMEOUT_MS = 5000;
const MAX_RETRIES = 3;
const RETRY_DELAYS_MS = [1000, 3000, 10000];

function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
}

function sign(bodyString) {
    const secret = process.env.WEBHOOK_SECRET;
    if (!secret) return null;
    return crypto.createHmac('sha256', secret).update(bodyString).digest('hex');
}

async function postOnce(url, bodyString, signature, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const headers = { 'Content-Type': 'application/json' };
        if (signature) headers['X-Webhook-Signature'] = `sha256=${signature}`;
        const res = await fetch(url, {
            method: 'POST',
            headers,
            body: bodyString,
            signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return true;
    } finally {
        clearTimeout(timer);
    }
}

export function dispatch(url, event, payload) {
    if (!url) return;

    const body = { event, timestamp: Date.now(), payload };
    const bodyString = JSON.stringify(body);
    const signature = sign(bodyString);

    (async () => {
        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
                await postOnce(url, bodyString, signature, DEFAULT_TIMEOUT_MS);
                if (attempt > 0) console.log(`[webhook] ${event} → succesful (try ${attempt + 1})`);
                return;
            } catch (err) {
                const isLast = attempt === MAX_RETRIES;
                console.warn(
                    `[webhook] ${event} mistake (${attempt + 1}/${MAX_RETRIES + 1}): ${err.message}${isLast ? ' - abandoned' : ''}`
                );
                if (isLast) return;
                await sleep(RETRY_DELAYS_MS[attempt]);
            }
        }
    })();
}
