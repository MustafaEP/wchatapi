"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import { isConfigured } from "@/lib/config";
import type { SessionStatus } from "@/lib/types";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import SessionCard from "@/components/SessionCard";
import Button from "@/components/Button";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<SessionStatus[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured()) {
      router.replace("/settings");
      return;
    }

    let stopped = false;

    async function tick() {
      try {
        const data = await api.listSessions();
        if (!stopped) {
          setSessions(data);
          setError(null);
          setLoading(false);
        }
      } catch (e) {
        if (!stopped) {
          setError(e instanceof ApiError ? e.message : String(e));
          setLoading(false);
        }
      }
    }

    tick();
    const interval = setInterval(tick, 3000);
    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, [router]);

  const total = sessions.length;
  const connected = sessions.filter((s) => s.state === "connected").length;
  const waitingQR = sessions.filter((s) => s.state === "qr").length;
  const offline = sessions.filter(
    (s) => s.state === "disconnected" || s.state === "logged_out"
  ).length;

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Command center."
        description="Tüm WhatsApp oturumlarının canlı durumu. Veriler 3 saniyede bir yenilenir."
        actions={
          <Link href="/sessions">
            <Button
              variant="primary"
              icon={<Plus className="w-4 h-4" strokeWidth={2} />}
            >
              Yeni Oturum
            </Button>
          </Link>
        }
      />

      <div className="px-10 pb-16 space-y-10">
        {error ? (
          <div className="hairline bg-red-500/5 border-red-500/30 rounded-lg p-6">
            <div className="text-2xs font-mono tracking-[0.2em] text-red-400 uppercase mb-2">
              Bağlantı hatası
            </div>
            <p className="text-text-secondary text-sm">{error}</p>
            <Link href="/settings" className="inline-block mt-4">
              <Button variant="secondary" size="sm">
                Ayarları kontrol et
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {/* Stat grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label="Toplam Oturum"
                value={loading ? "—" : total}
                hint={loading ? "yükleniyor" : "kayıtlı"}
                delta="01"
              />
              <StatCard
                label="Aktif"
                value={loading ? "—" : connected}
                hint={connected === total && total > 0 ? "hepsi hazır" : "bağlı"}
                accent="green"
                delta="02"
              />
              <StatCard
                label="QR Bekleniyor"
                value={loading ? "—" : waitingQR}
                hint="tarama lazım"
                accent={waitingQR > 0 ? "amber" : "default"}
                delta="03"
              />
              <StatCard
                label="Offline"
                value={loading ? "—" : offline}
                hint="bağlı değil"
                accent={offline > 0 ? "red" : "default"}
                delta="04"
              />
            </div>

            {/* Sessions list */}
            <section>
              <div className="flex items-baseline justify-between mb-5">
                <div>
                  <div className="text-2xs font-mono tracking-[0.2em] text-text-muted uppercase mb-1">
                    Sessions
                  </div>
                  <h2 className="font-display text-2xl">Son durum</h2>
                </div>
                <Link
                  href="/sessions"
                  className="group inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-accent-400 transition-colors"
                >
                  <span>Tümünü yönet</span>
                  <ArrowUpRight
                    className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
                    strokeWidth={1.5}
                  />
                </Link>
              </div>

              {sessions.length === 0 && !loading ? (
                <div className="hairline bg-ink-900/20 rounded-lg py-16 text-center">
                  <div className="font-display italic text-2xl text-text-secondary mb-2">
                    Henüz oturum yok.
                  </div>
                  <p className="text-sm text-text-muted mb-6">
                    İlk WhatsApp hesabını bağlayarak başla.
                  </p>
                  <Link href="/sessions">
                    <Button
                      icon={<Plus className="w-4 h-4" strokeWidth={2} />}
                    >
                      Oturum oluştur
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {sessions.map((s) => (
                    <SessionCard key={s.id} session={s} />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </>
  );
}
