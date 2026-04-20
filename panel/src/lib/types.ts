export type SessionState =
  | "connecting"
  | "qr"
  | "connected"
  | "disconnected"
  | "logged_out";

export interface SessionStatus {
  id: string;
  state: SessionState;
  hasQR: boolean;
  webhookUrl?: string | null;
}

export interface SendTextResult {
  ok: true;
  id: string;
  to: string;
}

export interface MediaInfo {
  type: "image" | "video" | "audio" | "document" | "sticker";
  mimetype: string | null;
  size: number | null;
  caption: string | null;
  filename: string | null;
  downloadUrl?: string;
}

export interface IncomingMessage {
  sessionId: string;
  id: string;
  from: string;
  fromMe: boolean;
  timestamp: number;
  pushName: string | null;
  text: string | null;
  media: MediaInfo | null;
}

export interface SentMessage {
  id: string;
  to: string;
  text: string;
  sentAt: number;
  fromMe: true;
}

export type ChatMessage =
  | (IncomingMessage & { kind: "in" })
  | (SentMessage & { kind: "out" });
