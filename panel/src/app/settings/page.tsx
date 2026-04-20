"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Eye, EyeOff, KeyRound, Server } from "lucide-react";
import {
  getBaseUrl,
  getApiKey,
  setConfig,
  clearConfig,
} from "@/lib/config";
import { api, ApiError } from "@/lib/api";
import PageHeader from "@/components/PageHeader";
import Button from "@/components/Button";
import Input from "@/components/Input";

export default function SettingsPage() {
  const router = useRouter();
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<
    { ok: true; count: number } | { ok: false; error: string } | null
  >(null);

  useEffect(() => {
    setBaseUrl(getBaseUrl() || "http://localhost:3000");
    setApiKey(getApiKey() || "");
  }, []);

  function save(e: React.FormEvent) {
    e.preventDefault();
    setConfig(baseUrl, apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  async function testConnection() {
    setConfig(baseUrl, apiKey); // önce kaydet, sonra test
    setTesting(true);
    setTestResult(null);
    try {
      const sessions = await api.listSessions();
      setTestResult({ ok: true, count: sessions.length });
    } catch (err) {
      setTestResult({
        ok: false,
        error: err instanceof ApiError ? err.message : String(err),
      });
    } finally {
      setTesting(false);
    }
  }

  function handleReset() {
    if (!confirm("Tüm ayarlar silinsin mi?")) return;
    clearConfig();
    setBaseUrl("");
    setApiKey("");
  }

  return (
    <>
      <PageHeader
        eyebrow="Settings"
        title="Bağlantı ayarları."
        description="Backend'in adresi ve API key'i. Bu değerler sadece tarayıcında (localStorage) tutulur, sunucuya yazılmaz."
      />

      <div className="px-10 pb-16 max-w-2xl">
        <form onSubmit={save} className="space-y-6">
          <div className="hairline bg-ink-900/40 rounded-lg p-6 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <Server className="w-4 h-4 text-accent-400" strokeWidth={1.5} />
              <div className="text-2xs font-mono tracking-[0.2em] text-text-muted uppercase">
                Endpoint
              </div>
            </div>
            <Input
              label="API Base URL"
              placeholder="http://localhost:3000"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              hint="Backend'in çalıştığı URL"
              mono
            />
          </div>

          <div className="hairline bg-ink-900/40 rounded-lg p-6 space-y-5">
            <div className="flex items-center gap-2 mb-1">
              <KeyRound
                className="w-4 h-4 text-accent-400"
                strokeWidth={1.5}
              />
              <div className="text-2xs font-mono tracking-[0.2em] text-text-muted uppercase">
                Authentication
              </div>
            </div>
            <div className="relative">
              <Input
                label="API Key"
                type={showKey ? "text" : "password"}
                placeholder="env dosyandaki API_KEY değeri"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                hint="Backend'de API_KEY boşsa bu alanı da boş bırakabilirsin"
                mono
              />
              <button
                type="button"
                onClick={() => setShowKey((v) => !v)}
                className="absolute right-3 top-[37px] p-1 text-text-muted hover:text-text-primary"
                aria-label="toggle"
              >
                {showKey ? (
                  <EyeOff className="w-4 h-4" strokeWidth={1.5} />
                ) : (
                  <Eye className="w-4 h-4" strokeWidth={1.5} />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button type="submit">
                {saved ? (
                  <>
                    <Check className="w-4 h-4" strokeWidth={2} />
                    Kaydedildi
                  </>
                ) : (
                  "Kaydet"
                )}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={testConnection}
                disabled={testing}
              >
                {testing ? "Test ediliyor…" : "Bağlantıyı test et"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => router.push("/")}
              >
                Panele dön
              </Button>
            </div>
            <button
              type="button"
              onClick={handleReset}
              className="text-xs font-mono tracking-widest uppercase text-text-muted hover:text-red-400 transition-colors"
            >
              Sıfırla
            </button>
          </div>

          {testResult && (
            <div
              className={
                testResult.ok
                  ? "hairline bg-accent-glow border-accent-400/30 rounded-lg p-4"
                  : "hairline bg-red-500/5 border-red-500/30 rounded-lg p-4"
              }
            >
              {testResult.ok ? (
                <div className="flex items-start gap-2.5">
                  <Check
                    className="w-4 h-4 text-accent-400 shrink-0 mt-0.5"
                    strokeWidth={2}
                  />
                  <div>
                    <div className="text-sm text-accent-400 font-medium">
                      Bağlantı başarılı
                    </div>
                    <div className="text-xs text-text-secondary mt-0.5 font-mono">
                      {testResult.count} oturum bulundu
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-red-400">{testResult.error}</div>
              )}
            </div>
          )}
        </form>
      </div>
    </>
  );
}
