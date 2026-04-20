"use client";

import clsx from "clsx";
import { forwardRef } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  icon?: React.ReactNode;
}

const variants: Record<Variant, string> = {
  primary:
    "bg-accent-500 hover:bg-accent-400 text-ink-950 font-medium shadow-[0_0_0_1px_rgba(52,211,153,0.3),0_8px_24px_-8px_rgba(52,211,153,0.4)]",
  secondary:
    "bg-ink-800 hover:bg-ink-700 text-text-primary hairline",
  ghost:
    "bg-transparent hover:bg-ink-800/60 text-text-secondary hover:text-text-primary",
  danger:
    "bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30",
};

const sizes: Record<Size, string> = {
  sm: "text-xs px-3 py-1.5 gap-1.5",
  md: "text-sm px-4 py-2 gap-2",
};

const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = "primary", size = "md", icon, className, children, ...rest },
  ref
) {
  return (
    <button
      ref={ref}
      className={clsx(
        "inline-flex items-center rounded-md transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-accent-400/50 disabled:opacity-40 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      {...rest}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </button>
  );
});

export default Button;
