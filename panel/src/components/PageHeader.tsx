"use client";

interface Props {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export default function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: Props) {
  return (
    <header className="px-10 pt-10 pb-8">
      <div className="flex items-end justify-between gap-6">
        <div className="min-w-0">
          {eyebrow && (
            <div className="text-2xs font-mono tracking-[0.2em] text-text-muted uppercase mb-3">
              {eyebrow}
            </div>
          )}
          <h1 className="font-display text-5xl leading-[1.05] tracking-tight">
            {title}
          </h1>
          {description && (
            <p className="mt-3 text-text-secondary max-w-xl">{description}</p>
          )}
        </div>
        {actions && <div className="shrink-0 flex gap-2">{actions}</div>}
      </div>
      <div className="dash-line mt-8" />
    </header>
  );
}
