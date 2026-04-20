"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { SessionStatus } from "@/lib/types";
import StatusBadge from "./StatusBadge";

interface Props {
  session: SessionStatus;
}

export default function SessionCard({ session }: Props) {
  return (
    <Link
      href={`/sessions/${session.id}`}
      className="group block hairline bg-ink-900/40 hover:bg-ink-900/70 rounded-lg p-5 transition-all relative"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <div className="text-2xs font-mono tracking-[0.15em] text-text-muted uppercase mb-1">
            session
          </div>
          <div className="font-display text-2xl truncate">{session.id}</div>
        </div>
        <ChevronRight className="w-4 h-4 text-text-dim group-hover:text-accent-400 transition-colors mt-3 shrink-0" />
      </div>

      <div className="flex items-center justify-between">
        <StatusBadge state={session.state} size="sm" />
        {session.hasQR && (
          <span className="text-2xs font-mono text-amber-400 tracking-widest uppercase">
            QR READY
          </span>
        )}
      </div>
    </Link>
  );
}
