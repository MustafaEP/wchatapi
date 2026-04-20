"use client";

import { useEffect, useState } from "react";
import { Save, Check, AlertCircle, Link as LinkIcon } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { SessionStatus } from "@/lib/types";
import PageHeader from "@/components/PageHeader";
import Button from "@/components/Button";
import Input from "@/components/Input";
import StatusBadge from "@/components/StatusBadge";

interface Row extends SessionStatus {
  webhook: string;
  saved: boolean;
  saving: boolean;
  error?: string;
}

export default function WebhooksPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const sessions = await api.listSessions();
        // Backend şu an session listinde webhook URL'i döndürmüyor;
        // satır bazlı input ile yönetiyoruz.
        setRows(
          sessions.map((s) => ({
            ...s,
            webhook: "",
            saved: false,
            saving: false,
          }))
        );
      } catch (e) {
        setError(e instanceof ApiError ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function save(id: string) {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, saving: true, error: undefined } : r
      )
    );
    const row = rows.find((r) => r.id === id);
    try {
      await api.setWebhook(id, row?.webhook.trim() || null);
      setRows((prev) =>
        prev.map((r) =>
          r.id === id
            ? { ...r, saving: false, saved: true }
            : r
        )
      );
      setTimeout(() => {
        setRows((prev) =>
          prev.map((r) => (r.id === id ? { ...r, saved: false } : r))
        );
      }, 2000);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : String(err);
      setRows((prev) =>
        prev.map((r) =>
          r.id === id ? { ...r, saving: false, error: msg } : r
        )
      );
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Webhooks"
        title="Webhook yönlendirme."
        description="Gelen mesajlar, QR güncellemeleri ve bağlantı olayları bu URL'lere POST edilir. İmza X-Webhook-Signature (sha256 HMAC) header'ında gelir."
      />

      <div className="px-10 pb-16">
        {error && (
          <div className="hairline bg-red-500/5 border-red-500/30 rounded-lg p-5 text-sm text-red-400 mb-6">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-sm text-text-muted">Yükleniyor…</div>
        ) : rows.length === 0 ? (
          <div className="hairline bg-ink-900/20 rounded-lg py-16 text-center">
            <div className="font-display italic text-2xl text-text-secondary mb-2">
              Önce bir oturum lazım.
            </div>
            <p className="text-sm text-text-muted">
              Sessions sekmesinden bir oturum oluştur, sonra buradan webhook
              ata.
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-10">
              {rows.map((row) => (
                <div
                  key={row.id}
                  className="hairline bg-ink-900/40 rounded-lg p-5 space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-2xs font-mono tracking-[0.15em] text-text-muted uppercase mb-1">
                        session
                      </div>
                      <div className="font-display text-xl truncate">
                        {row.id}
                      </div>
                    </div>
                    <StatusBadge state={row.state} size="sm" />
                  </div>

                  <Input
                    label="Webhook URL"
                    placeholder="https://example.com/hook"
                    value={row.webhook}
                    onChange={(e) =>
                      setRows((prev) =>
                        prev.map((r) =>
                          r.id === row.id
                            ? { ...r, webhook: e.target.value, saved: false }
                            : r
                        )
                      )
                    }
                    mono
                  />

                  {row.error && (
                    <div className="flex items-start gap-2 text-xs text-red-400">
                      <AlertCircle
                        className="w-3.5 h-3.5 shrink-0 mt-0.5"
                        strokeWidth={1.5}
                      />
                      <span>{row.error}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    {row.saved ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-mono tracking-widest uppercase text-accent-400">
                        <Check className="w-3.5 h-3.5" strokeWidth={2} />
                        Kaydedildi
                      </span>
                    ) : (
                      <span className="text-2xs font-mono text-text-dim">
                        Değişikliği kaydetmek için kaydet
                      </span>
                    )}
                    <Button
                      size="sm"
                      onClick={() => save(row.id)}
                      disabled={row.saving}
                      icon={<Save className="w-3.5 h-3.5" strokeWidth={1.5} />}
                    >
                      {row.saving ? "Kaydediliyor…" : "Kaydet"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Docs box */}
            <div className="hairline bg-ink-950/40 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <LinkIcon
                  className="w-4 h-4 text-accent-400"
                  strokeWidth={1.5}
                />
                <div className="text-2xs font-mono tracking-[0.2em] text-text-muted uppercase">
                  Webhook payload şeması
                </div>
              </div>
              <pre className="text-xs font-mono text-text-secondary bg-ink-950 rounded-md p-4 overflow-x-auto leading-relaxed">
{`POST {webhookUrl}
Content-Type: application/json
X-Webhook-Signature: sha256=<hmac>

{
  "event": "message" | "message.ack" | "session.status" | "qr",
  "timestamp": 1729180000000,
  "payload": {
    "sessionId": "alice",
    ...
  }
}`}
              </pre>
            </div>
          </>
        )}
      </div>
    </>
  );
}
