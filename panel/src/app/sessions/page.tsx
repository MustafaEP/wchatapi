"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, X, Trash2 } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { SessionStatus } from "@/lib/types";
import PageHeader from "@/components/PageHeader";
import Button from "@/components/Button";
import Input from "@/components/Input";
import StatusBadge from "@/components/StatusBadge";

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionStatus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newId, setNewId] = useState("");
  const [webhookUrl, setWebhookUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function refresh() {
    try {
      const data = await api.listSessions();
      setSessions(data);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    }
  }

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 3000);
    return () => clearInterval(interval);
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newId.trim()) return;
    setSubmitting(true);
    setCreateError(null);
    try {
      await api.startSession(newId.trim(), webhookUrl.trim() || undefined);
      setNewId("");
      setWebhookUrl("");
      setCreating(false);
      refresh();
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(`"${id}" oturumu silinsin mi? Bu işlem telefondan da çıkış yapar.`))
      return;
    setDeletingId(id);
    try {
      await api.deleteSession(id);
      refresh();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : String(err));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Sessions"
        title="Oturumlar."
        description="Her oturum ayrı bir WhatsApp hesabıdır. İstediğin kadar oturum ekleyebilirsin."
        actions={
          !creating && (
            <Button
              onClick={() => setCreating(true)}
              icon={<Plus className="w-4 h-4" strokeWidth={2} />}
            >
              Yeni Oturum
            </Button>
          )
        }
      />

      <div className="px-10 pb-16 space-y-6">
        {creating && (
          <div className="hairline bg-ink-900/40 rounded-lg p-6 animate-fade-in">
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="text-2xs font-mono tracking-[0.2em] text-text-muted uppercase mb-1">
                  New session
                </div>
                <h2 className="font-display text-2xl">Oturum tanımla</h2>
              </div>
              <button
                onClick={() => setCreating(false)}
                className="p-1.5 hover:bg-ink-800 rounded text-text-muted hover:text-text-primary"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 max-w-xl">
              <Input
                label="Oturum ID"
                placeholder="alice"
                value={newId}
                onChange={(e) => setNewId(e.target.value)}
                hint="Sadece harf, rakam, _ ve -"
                mono
                autoFocus
              />
              <Input
                label="Webhook URL (opsiyonel)"
                placeholder="https://example.com/hook"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                hint="Gelen mesajlar ve olaylar bu URL'ye POST edilir"
                mono
              />

              {createError && (
                <div className="text-sm text-red-400 bg-red-500/5 border border-red-500/20 rounded-md px-3 py-2.5">
                  {createError}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={submitting || !newId.trim()}>
                  {submitting ? "Oluşturuluyor…" : "Oluştur ve başlat"}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setCreating(false)}
                >
                  İptal
                </Button>
              </div>
            </form>
          </div>
        )}

        {error && (
          <div className="hairline bg-red-500/5 border-red-500/30 rounded-lg p-5 text-sm text-red-400">
            {error}
          </div>
        )}

        {sessions.length === 0 && !error && !creating ? (
          <div className="hairline bg-ink-900/20 rounded-lg py-20 text-center">
            <div className="font-display italic text-3xl text-text-secondary mb-3">
              Burası henüz boş.
            </div>
            <p className="text-sm text-text-muted max-w-sm mx-auto">
              İlk oturumu oluştur; sistem sana bir QR kodu verecek ve
              WhatsApp'ından tarattığında hazır olacak.
            </p>
          </div>
        ) : (
          <div className="hairline bg-ink-900/30 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="hairline-b bg-ink-950/40">
                  <th className="text-left px-5 py-3 text-2xs font-mono tracking-[0.15em] text-text-muted uppercase">
                    ID
                  </th>
                  <th className="text-left px-5 py-3 text-2xs font-mono tracking-[0.15em] text-text-muted uppercase">
                    Durum
                  </th>
                  <th className="text-left px-5 py-3 text-2xs font-mono tracking-[0.15em] text-text-muted uppercase">
                    QR
                  </th>
                  <th className="text-right px-5 py-3 text-2xs font-mono tracking-[0.15em] text-text-muted uppercase">
                    İşlem
                  </th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s, idx) => (
                  <tr
                    key={s.id}
                    className={
                      idx !== sessions.length - 1
                        ? "hairline-b hover:bg-ink-900/40 transition-colors"
                        : "hover:bg-ink-900/40 transition-colors"
                    }
                  >
                    <td className="px-5 py-4">
                      <Link
                        href={`/sessions/${s.id}`}
                        className="font-mono text-sm text-text-primary hover:text-accent-400 transition-colors"
                      >
                        {s.id}
                      </Link>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge state={s.state} size="sm" />
                    </td>
                    <td className="px-5 py-4">
                      {s.hasQR ? (
                        <span className="text-2xs font-mono tracking-widest uppercase text-amber-400">
                          Hazır
                        </span>
                      ) : (
                        <span className="text-2xs font-mono text-text-dim">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="inline-flex gap-1">
                        <Link href={`/sessions/${s.id}`}>
                          <Button variant="ghost" size="sm">
                            Detay
                          </Button>
                        </Link>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDelete(s.id)}
                          disabled={deletingId === s.id}
                          icon={
                            <Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />
                          }
                        >
                          {deletingId === s.id ? "…" : "Sil"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
