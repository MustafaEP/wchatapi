"use client";

import clsx from "clsx";
import { forwardRef } from "react";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  mono?: boolean;
}

const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, hint, mono, className, id, ...rest },
  ref
) {
  const inputId = id ?? rest.name;
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-2xs font-mono tracking-[0.15em] text-text-muted uppercase mb-2"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={clsx(
          "w-full bg-ink-950/60 hairline rounded-md px-3.5 py-2.5 text-sm",
          "placeholder:text-text-dim",
          "outline-none transition-colors",
          "focus:border-accent-400/50 focus:bg-ink-950",
          mono && "font-mono",
          className
        )}
        {...rest}
      />
      {hint && <p className="mt-2 text-xs text-text-muted">{hint}</p>}
    </div>
  );
});

export default Input;

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }
>(function Textarea({ label, className, id, ...rest }, ref) {
  const inputId = id ?? rest.name;
  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-2xs font-mono tracking-[0.15em] text-text-muted uppercase mb-2"
        >
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={inputId}
        className={clsx(
          "w-full bg-ink-950/60 hairline rounded-md px-3.5 py-2.5 text-sm",
          "placeholder:text-text-dim",
          "outline-none transition-colors resize-none",
          "focus:border-accent-400/50 focus:bg-ink-950",
          className
        )}
        {...rest}
      />
    </div>
  );
});
