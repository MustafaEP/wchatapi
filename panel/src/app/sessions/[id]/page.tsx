"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Trash2, RefreshCw } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { SessionStatus } from "@/lib/types";
import PageHeader from "@/components/PageHeader";
import Button from "@/components/Button";
import StatusBadge from "@/components/StatusBadge";
import QrDisplay from "@/components/QrDisplay";
import SendMessageForm from "@/components/SendMessageForm";

export default function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [status, setStatus] = useState<SessionStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      const s = await api.getSession(id);
      setStatus(s);
      setError(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : String(e));
    }
  }

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 2500);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleDelete() {
    if (!confirm(`"${id}" oturumu silinsin mi? Telefondan da çıkış yapar.`))
      return;
    try {
      await api.deleteSession(id);
      router.push("/sessions");
    } catch (err) {
      alert(err instanceof ApiError ? err.message : String(err));
    }
  }

  async function handleRestart() {
    try {
      await api.startSession(id);
      refresh();
    } catch (err) {
      alert(err instanceof ApiError ? err.message : String(err));
    }
  }

  const isConnected = status?.state === "connected";
  const needsQR = status?.state === "qr" || status?.hasQR;

  return (
    <>
      <div className="px-10 pt-8">
        <Link
          href="/sessions"
          className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.5} />
          <span>Oturumlar</span>
        </Link>
      </div>

      <PageHeader
        eyebrow={`Session · ${id}`}
        title={id}
        description={
          status
            ? isConnected
              ? "Bu oturum aktif. Aşağıdaki formdan mesaj gönderebilirsin."
              : "Oturum henüz hazır değil. Durumu izle veya işlem yap."
            : "Yükleniyor…"
        }
        actions={
          status && (
            <>
              {!isConnected && status.state !== "qr" && (
                <Button
                  variant="secondary"
                  onClick={handleRestart}
                  icon={<RefreshCw className="w-3.5 h-3.5" strokeWidth={1.5} />}
                >
                  Yeniden başlat
                </Button>
              )}
              <Button
                variant="danger"
                onClick={handleDelete}
                icon={<Trash2 className="w-3.5 h-3.5" strokeWidth={1.5} />}
              >
                Sil
              </Button>
            </>
          )
        }
      />

      <div className="px-10 pb-16">
        {error && (
          <div className="hairline bg-red-500/5 border-red-500/30 rounded-lg p-5 text-sm text-red-400 mb-6">
            {error}
          </div>
        )}

        {status && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Status + info */}
            <div className="lg:col-span-1 space-y-4">
              <div className="hairline bg-ink-900/40 rounded-lg p-5">
                <div className="text-2xs font-mono tracking-[0.2em] text-text-muted uppercase mb-3">
                  Durum
                </div>
                <div className="mb-4">
                  <StatusBadge state={status.state} />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Oturum ID</span>
                    <span className="font-mono">{status.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">QR</span>
                    <span className="font-mono">
                      {status.hasQR ? "hazır" : "—"}
                    </span>
                  </div>
                </div>
              </div>

              {needsQR && (
                <QrDisplay sessionId={id} onConnected={refresh} />
              )}

              {status.state === "logged_out" && (
                <div className="hairline bg-amber-500/5 border-amber-500/30 rounded-lg p-5">
                  <div className="text-2xs font-mono tracking-[0.2em] text-amber-400 uppercase mb-2">
                    Çıkış yapıldı
                  </div>
                  <p className="text-sm text-text-secondary mb-4">
                    Telefondan bu cihaz bağlantısı silinmiş. Yeniden başlat ve
                    QR'ı tekrar tara.
                  </p>
                  <Button size="sm" variant="secondary" onClick={handleRestart}>
                    Yeniden başlat
                  </Button>
                </div>
              )}
            </div>

            {/* Right: Send form */}
            <div className="lg:col-span-2">
              <div className="hairline bg-ink-900/40 rounded-lg p-6">
                <div className="mb-6">
                  <div className="text-2xs font-mono tracking-[0.2em] text-text-muted uppercase mb-1">
                    Compose
                  </div>
                  <h2 className="font-display text-2xl">Mesaj gönder</h2>
                </div>
                <SendMessageForm sessionId={id} disabled={!isConnected} />
                {!isConnected && (
                  <p className="mt-4 text-xs text-text-muted font-mono">
                    Gönderim için oturumun CONNECTED olması gerekir.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
