"use client";

import { getBaseUrl, getApiKey } from "./config";
import type { SessionStatus, SendTextResult } from "./types";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const base = getBaseUrl();
  if (!base) {
    throw new ApiError("API base URL ayarlanmamış. Ayarlar'a git.", 0);
  }
  const key = getApiKey();
  const headers = new Headers(init.headers);
  const isFormData = init.body instanceof FormData;
  if (!isFormData && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (key) headers.set("X-API-Key", key);

  let res: Response;
  try {
    res = await fetch(`${base}${path}`, { ...init, headers });
  } catch (e) {
    throw new ApiError(
      `Sunucuya ulaşılamadı (${base}). Backend çalışıyor mu?`,
      0
    );
  }

  const text = await res.text();
  const data = text ? safeJson(text) : null;

  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && "error" in data
        ? String((data as { error: unknown }).error)
        : null) ?? `HTTP ${res.status}`;
    throw new ApiError(msg, res.status);
  }
  return data as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export const api = {
  listSessions(): Promise<SessionStatus[]> {
    return req<SessionStatus[]>("/sessions");
  },
  getSession(id: string): Promise<SessionStatus> {
    return req<SessionStatus>(`/sessions/${id}/status`);
  },
  startSession(id: string, webhookUrl?: string): Promise<SessionStatus> {
    return req<SessionStatus>(`/sessions/${id}/start`, {
      method: "POST",
      body: JSON.stringify(webhookUrl ? { webhookUrl } : {}),
    });
  },
  deleteSession(id: string): Promise<{ ok: true }> {
    return req<{ ok: true }>(`/sessions/${id}`, { method: "DELETE" });
  },
  getQR(id: string): Promise<{ qr: string }> {
    return req<{ qr: string }>(`/sessions/${id}/qr`);
  },
  sendText(id: string, to: string, text: string): Promise<SendTextResult> {
    return req<SendTextResult>(`/sessions/${id}/send`, {
      method: "POST",
      body: JSON.stringify({ to, text }),
    });
  },
  setWebhook(id: string, url: string | null): Promise<{ ok: true }> {
    return req<{ ok: true }>(`/sessions/${id}/webhook`, {
      method: "PUT",
      body: JSON.stringify({ url }),
    });
  },
};

export { ApiError };
