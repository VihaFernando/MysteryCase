import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { config } from "@/constants/config";
import { WebSocketClient } from "./WebSocketClient";
import { BrowserSocketAdapter, MockSocketAdapter } from "./MockSocketAdapter";
import { EVENT_INVALIDATIONS, SERVER_EVENTS } from "./events";
import type { ConnectionStatus, Listener, ServerEvent } from "./types";

interface Ctx {
  client: WebSocketClient | null;
  status: ConnectionStatus;
  isMock: boolean;
}

const WebSocketContext = createContext<Ctx>({ client: null, status: "offline", isMock: true });

export function WebSocketProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const [client, setClient] = useState<WebSocketClient | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>("connecting");
  const isMock = !config.wsUrl;

  useEffect(() => {
    const adapter = isMock ? new MockSocketAdapter() : new BrowserSocketAdapter();
    const c = new WebSocketClient(config.wsUrl || "mock://local", adapter);
    const offStatus = c.onStatus(setStatus);
    const offs = SERVER_EVENTS.map((ev) =>
      c.subscribe(ev, (payload) => {
        const keys = EVENT_INVALIDATIONS[ev]?.(payload as { caseId?: string }) ?? [];
        keys.forEach((queryKey) => qc.invalidateQueries({ queryKey }));
      }),
    );
    setClient(c);
    c.connect();
    return () => { offStatus(); offs.forEach((o) => o()); c.disconnect(); };
  }, [isMock, qc]);

  return <WebSocketContext.Provider value={{ client, status, isMock }}>{children}</WebSocketContext.Provider>;
}

export function useWebSocket() {
  return useContext(WebSocketContext);
}

export function useRealtimeEvent<E extends ServerEvent>(event: E, handler: Listener<E>) {
  const { client } = useWebSocket();
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!client) return;
    return client.subscribe(event, (p) => ref.current(p));
  }, [client, event]);
}
