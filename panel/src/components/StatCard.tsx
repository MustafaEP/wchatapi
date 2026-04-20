"use client";

import clsx from "clsx";

interface Props {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "default" | "green" | "amber" | "red";
  delta?: string;
}

const accents = {
  default: "text-text-primary",
  green: "text-accent-400",
  amber: "text-amber-400",
  red: "text-red-400",
};

export default function StatCard({
  label,
  value,
  hint,
  accent = "default",
  delta,
}: Props) {
  return (
    <div className="hairline bg-ink-900/40 rounded-lg p-6 relative overflow-hidden group hover:bg-ink-900/60 transition-colors">
      {/* Corner mark */}
      <div className="absolute top-3 right-3 text-2xs font-mono text-text-dim">
        {delta}
      </div>

      <div className="text-2xs font-mono tracking-[0.2em] text-text-muted uppercase mb-4">
        {label}
      </div>

      <div
        className={clsx(
          "font-display leading-none text-5xl",
          accents[accent]
        )}
      >
        <span className="mono-num">{value}</span>
      </div>

      {hint && (
        <div className="mt-3 text-xs text-text-muted font-mono">{hint}</div>
      )}

      {/* Hover accent line */}
      <div className="absolute bottom-0 left-0 h-px w-full bg-gradient-to-r from-transparent via-accent-400/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
