"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessagesSquare,
  Webhook,
  Settings,
  Radio,
} from "lucide-react";
import clsx from "clsx";

const nav = [
  { href: "/", label: "Overview", icon: LayoutDashboard },
  { href: "/sessions", label: "Sessions", icon: MessagesSquare },
  { href: "/webhooks", label: "Webhooks", icon: Webhook },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 hairline-r flex flex-col bg-ink-950/60 backdrop-blur">
      {/* Brand */}
      <div className="px-6 pt-7 pb-8">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Radio className="w-5 h-5 text-accent-400" strokeWidth={1.5} />
            <div className="absolute inset-0 blur-md bg-accent-400 opacity-40" />
          </div>
          <div className="font-display italic text-2xl leading-none tracking-tight">
            waha<span className="text-text-muted">·</span>mini
          </div>
        </div>
        <div className="mt-1.5 text-2xs font-mono tracking-widest text-text-muted uppercase pl-[30px]">
          operator console
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 pt-2">
        {nav.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "group flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors relative",
                active
                  ? "text-text-primary bg-ink-800/80"
                  : "text-text-secondary hover:text-text-primary hover:bg-ink-800/40"
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-accent-400 rounded-r-full" />
              )}
              <Icon
                className={clsx(
                  "w-4 h-4 transition-colors",
                  active ? "text-accent-400" : "text-text-muted"
                )}
                strokeWidth={1.5}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-5 hairline-t">
        <div className="text-2xs font-mono tracking-widest text-text-muted uppercase mb-1.5">
          build
        </div>
        <div className="text-xs font-mono text-text-secondary">
          v0.1.0 · dev
        </div>
      </div>
    </aside>
  );
}
