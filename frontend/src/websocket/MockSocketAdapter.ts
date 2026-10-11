import type { Envelope, ServerEvent, ServerEventMap, SocketAdapter } from "./types";

/**
 * Development adapter. Simulates a connection handshake and periodically emits
 * plausible player events so realtime UI can be exercised without a server.
 */
export class MockSocketAdapter implements SocketAdapter {
  onOpen: (() => void) | null = null;
  onClose: (() => void) | null = null;
  onMessage: ((data: string) => void) | null = null;
  private timers: Array<ReturnType<typeof setTimeout>> = [];

  open() {
    this.timers.push(setTimeout(() => this.onOpen?.(), 900));
    this.timers.push(setInterval(() => {
      const score = 520 + Math.round(Math.random() * 420);
      this.emit("player.case_completed", { caseId: "case-001", playerId: `p-${Math.round(Math.random() * 9000)}`, score });
    }, 45000) as unknown as ReturnType<typeof setTimeout>);
  }

  close() {
    this.timers.forEach((t) => { clearTimeout(t); clearInterval(t); });
    this.timers = [];
    this.onClose?.();
  }

  send(data: string) {
    if (import.meta.env.DEV) console.debug("[mock-ws] →", data);
  }

  /** Test helper: inject a server event. */
  emit<E extends ServerEvent>(event: E, payload: ServerEventMap[E]) {
    const env: Envelope<E, ServerEventMap[E]> = { event, payload, ts: new Date().toISOString() };
    this.onMessage?.(JSON.stringify(env));
  }
}

export class BrowserSocketAdapter implements SocketAdapter {
  onOpen: (() => void) | null = null;
  onClose: (() => void) | null = null;
  onMessage: ((data: string) => void) | null = null;
  private ws: WebSocket | null = null;

  open(url: string) {
    this.ws = new WebSocket(url);
    this.ws.onopen = () => this.onOpen?.();
    this.ws.onclose = () => this.onClose?.();
    this.ws.onmessage = (e) => this.onMessage?.(String(e.data));
  }
  close() { this.ws?.close(); this.ws = null; }
  send(data: string) { if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(data); }
}
