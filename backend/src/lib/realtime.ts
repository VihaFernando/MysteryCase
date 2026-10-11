import type { Server } from "bun";

let server: Server<undefined>;
export const bindServer = (s: Server<undefined>) => { server = s; };

/** Broadcast a typed event envelope (matches frontend src/websocket/types.ts) to every connected client. */
export const emit = (event: string, payload: Record<string, unknown>) =>
  server.publish("all", JSON.stringify({ event, payload, ts: new Date().toISOString() }));
