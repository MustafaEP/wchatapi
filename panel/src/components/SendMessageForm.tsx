"use client";

import { useState } from "react";
import { Send, Check, AlertCircle } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import Button from "./Button";
import Input, { Textarea } from "./Input";
import type { SentMessage } from "@/lib/types";

interface Props {
  sessionId: string;
  disabled?: boolean;
}

export default function SendMessageForm({ sessionId, disabled }: Props) {
  const [to, setTo] = useState("");
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<SentMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!to.trim() || !text.trim()) return;
    setSending(true);
    setError(null);
    try {
      const result = await api.sendText(sessionId, to.trim(), text);
      setSent((prev) => [
        {
          id: result.id,
          to: result.to,
          text,
          sentAt: Date.now(),
          fromMe: true,
        },
        ...prev,
      ].slice(0, 20));
      setText("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : String(err));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Alıcı"
          placeholder="905551112233"
          value={to}
          onChange={(e) => setTo(e.target.value)}
          hint="Ülke kodu dahil, + ve 0 olmadan"
          mono
          disabled={disabled || sending}
        />
        <Textarea
          label="Mesaj"
          rows={4}
          placeholder="Merhaba..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={disabled || sending}
        />

        {error && (
          <div className="flex items-start gap-2.5 text-sm text-red-400 bg-red-500/5 border border-red-500/20 rounded-md px-3 py-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" strokeWidth={1.5} />
            <span>{error}</span>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={disabled || sending || !to.trim() || !text.trim()}
            icon={<Send className="w-4 h-4" strokeWidth={1.5} />}
          >
            {sending ? "Gönderiliyor…" : "Gönder"}
          </Button>
        </div>
      </form>

      {sent.length > 0 && (
        <div className="pt-6 hairline-t">
          <div className="text-2xs font-mono tracking-[0.2em] text-text-muted uppercase mb-4">
            Bu oturumda gönderilen
          </div>
          <div className="space-y-2">
            {sent.map((m) => (
              <div
                key={m.id}
                className="flex items-start gap-3 bg-ink-900/30 hairline rounded-md p-3 animate-fade-in"
              >
                <Check
                  className="w-3.5 h-3.5 text-accent-400 mt-1 shrink-0"
                  strokeWidth={2}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-3 mb-1">
                    <span className="font-mono text-xs text-text-muted truncate">
                      {m.to.replace("@s.whatsapp.net", "")}
                    </span>
                    <span className="font-mono text-2xs text-text-dim shrink-0">
                      {new Date(m.sentAt).toLocaleTimeString("tr-TR")}
                    </span>
                  </div>
                  <div className="text-sm text-text-primary whitespace-pre-wrap break-words">
                    {m.text}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
