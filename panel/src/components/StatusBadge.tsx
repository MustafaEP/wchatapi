"use client";

import clsx from "clsx";
import type { SessionState } from "@/lib/types";

const styles: Record<
  SessionState,
  { dot: string; text: string; label: string; pulse?: boolean }
> = {
  connected: {
    dot: "bg-accent-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]",
    text: "text-accent-400",
    label: "CONNECTED",
  },
  connecting: {
    dot: "bg-amber-400",
    text: "text-amber-400",
    label: "CONNECTING",
    pulse: true,
  },
  qr: {
    dot: "bg-amber-400",
    text: "text-amber-400",
    label: "AWAITING QR",
    pulse: true,
  },
  disconnected: {
    dot: "bg-text-muted",
    text: "text-text-muted",
    label: "DISCONNECTED",
  },
  logged_out: {
    dot: "bg-red-500",
    text: "text-red-400",
    label: "LOGGED OUT",
  },
};

interface Props {
  state: SessionState;
  size?: "sm" | "md";
}

export default function StatusBadge({ state, size = "md" }: Props) {
  const s = styles[state];
  return (
    <div
      className={clsx(
        "inline-flex items-center gap-2 font-mono tracking-[0.15em] uppercase",
        size === "sm" ? "text-2xs" : "text-xs"
      )}
    >
      <span
        className={clsx(
          "rounded-full",
          size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2",
          s.dot,
          s.pulse && "animate-pulse-dot"
        )}
      />
      <span className={s.text}>{s.label}</span>
    </div>
  );
}
