"use client";

const KEYS = {
  base: "waha_mini_base_url",
  key: "waha_mini_api_key",
} as const;

export function getBaseUrl(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(KEYS.base) ?? "";
}

export function getApiKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(KEYS.key) ?? "";
}

export function setConfig(baseUrl: string, apiKey: string) {
  localStorage.setItem(KEYS.base, baseUrl.trim().replace(/\/$/, ""));
  localStorage.setItem(KEYS.key, apiKey.trim());
}

export function clearConfig() {
  localStorage.removeItem(KEYS.base);
  localStorage.removeItem(KEYS.key);
}

export function isConfigured(): boolean {
  return Boolean(getBaseUrl());
}
