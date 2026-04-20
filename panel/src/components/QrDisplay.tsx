"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Loader2, Smartphone } from "lucide-react";
import { api } from "@/lib/api";

interface Props {
  sessionId: string;
  onConnected?: () => void;
}

export default function QrDisplay({ sessionId, onConnected }: Props) {
  const [qr, setQr] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stopped = false;

    async function poll() {
      try {
        const status = await api.getSession(sessionId);
        if (stopped) return;

        if (status.state === "connected") {
          setQr(null);
          onConnected?.();
          return; // stop polling, caller will unmount
        }

        if (status.hasQR) {
          const { qr: qrString } = await api.getQR(sessionId);
          if (!stopped) setQr(qrString);
        } else {
          setQr(null);
        }
      } catch (e) {
        if (!stopped) setError(e instanceof Error ? e.message : String(e));
      }
    }

    poll();
    const interval = setInterval(poll, 2500);
    return () => {
      stopped = true;
      clearInterval(interval);
    };
  }, [sessionId, onConnected]);

  if (error) {
    return (
      <div className="hairline bg-red-500/5 rounded-lg p-8 text-center">
        <p className="text-red-400 text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="hairline bg-ink-900/40 rounded-lg p-8">
      <div className="flex items-center gap-2 mb-6 text-2xs font-mono tracking-[0.2em] text-text-muted uppercase">
        <Smartphone className="w-3.5 h-3.5" strokeWidth={1.5} />
        Telefondan Tara
      </div>

      <div className="flex items-center justify-center">
        {qr ? (
          <div className="bg-text-primary p-5 rounded-md animate-fade-in">
            <QRCodeSVG
              value={qr}
              size={260}
              level="L"
              bgColor="#f4f1e8"
              fgColor="#0a0e1a"
            />
          </div>
        ) : (
          <div className="w-[300px] h-[300px] hairline rounded-md flex flex-col items-center justify-center gap-4 text-text-muted">
            <Loader2
              className="w-6 h-6 animate-spin text-accent-400"
              strokeWidth={1.5}
            />
            <span className="text-xs font-mono tracking-widest uppercase">
              QR hazırlanıyor
            </span>
          </div>
        )}
      </div>

      <div className="mt-6 text-sm text-text-secondary leading-relaxed">
        WhatsApp → Ayarlar → Bağlı Cihazlar → <strong>Cihaz Bağla</strong>
      </div>
    </div>
  );
}
