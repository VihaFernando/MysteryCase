import type { Case, Notification } from "@/types";

export type ConnectionStatus = "connected" | "connecting" | "offline" | "reconnecting";

/** Server → client event payloads. Keep in sync with the Bun WebSocket server. */
export interface ServerEventMap {
  "case.updated": { caseId: string; updatedBy: string; fields: string[] };
  "case.published": { caseId: string; version: string };
  "case.deleted": { caseId: string };
  "case.review_requested": { caseId: string; requestedBy: string };
  "player.case_started": { caseId: string; playerId: string };
  "player.case_completed": { caseId: string; playerId: string; score: number };
  "analytics.updated": { caseId: string };
  "notification.created": Notification;
}

export type ServerEvent = keyof ServerEventMap;

/** Client → server messages. */
export interface ClientEventMap {
  "case.subscribe": { caseId: string };
  "case.unsubscribe": { caseId: string };
  "presence.update": { caseId: string; section: string };
}
export type ClientEvent = keyof ClientEventMap;

export interface Envelope<E extends string, P> {
  event: E;
  payload: P;
  ts: string;
}

export type Listener<E extends ServerEvent> = (payload: ServerEventMap[E]) => void;

/** Transport abstraction — real WebSocket or mock adapter. */
export interface SocketAdapter {
  open(url: string): void;
  close(): void;
  send(data: string): void;
  onOpen: (() => void) | null;
  onClose: (() => void) | null;
  onMessage: ((data: string) => void) | null;
}

export type CaseLite = Pick<Case, "id" | "code" | "title">;
