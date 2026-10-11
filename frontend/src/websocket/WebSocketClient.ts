import type { ClientEvent, ClientEventMap, ConnectionStatus, Envelope, Listener, ServerEvent, ServerEventMap, SocketAdapter } from "./types";

/** Typed, reconnecting WebSocket client. Transport is injected so mock and real servers share one API. */
export class WebSocketClient {
  private listeners = new Map<ServerEvent, Set<Listener<ServerEvent>>>();
  private statusListeners = new Set<(s: ConnectionStatus) => void>();
  private _status: ConnectionStatus = "offline";
  private retries = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private manualClose = false;
  private queue: string[] = [];

  constructor(private readonly url: string, private readonly adapter: SocketAdapter, private readonly maxRetries = 6) {
    adapter.onOpen = () => {
      this.retries = 0;
      this.setStatus("connected");
      this.queue.splice(0).forEach((m) => adapter.send(m));
    };
    adapter.onClose = () => {
      if (this.manualClose) return this.setStatus("offline");
      this.scheduleReconnect();
    };
    adapter.onMessage = (raw) => this.dispatch(raw);
  }

  get status() { return this._status; }

  connect() {
    this.manualClose = false;
    this.setStatus(this.retries ? "reconnecting" : "connecting");
    try {
      this.adapter.open(this.url);
    } catch {
      this.scheduleReconnect();
    }
  }

  disconnect() {
    this.manualClose = true;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.adapter.close();
    this.setStatus("offline");
  }

  /** Force a reconnect cycle (used by the status menu). */
  reconnect() {
    this.adapter.close();
    this.manualClose = false;
    this.retries = 1;
    this.setStatus("reconnecting");
    this.retryTimer = setTimeout(() => this.connect(), 700);
  }

  subscribe<E extends ServerEvent>(event: E, fn: Listener<E>): () => void {
    const set = this.listeners.get(event) ?? new Set();
    set.add(fn as Listener<ServerEvent>);
    this.listeners.set(event, set);
    return () => this.unsubscribe(event, fn);
  }

  unsubscribe<E extends ServerEvent>(event: E, fn: Listener<E>) {
    this.listeners.get(event)?.delete(fn as Listener<ServerEvent>);
  }

  send<E extends ClientEvent>(event: E, payload: ClientEventMap[E]) {
    const msg = JSON.stringify({ event, payload, ts: new Date().toISOString() });
    if (this._status === "connected") this.adapter.send(msg);
    else this.queue.push(msg);
  }

  onStatus(fn: (s: ConnectionStatus) => void) {
    this.statusListeners.add(fn);
    return () => { this.statusListeners.delete(fn); };
  }

  private setStatus(s: ConnectionStatus) {
    this._status = s;
    this.statusListeners.forEach((fn) => fn(s));
  }

  private scheduleReconnect() {
    if (this.retries >= this.maxRetries) return this.setStatus("offline");
    this.retries++;
    this.setStatus("reconnecting");
    const wait = Math.min(15000, 500 * 2 ** this.retries);
    this.retryTimer = setTimeout(() => this.connect(), wait);
  }

  private dispatch(raw: string) {
    try {
      const env = JSON.parse(raw) as Envelope<ServerEvent, ServerEventMap[ServerEvent]>;
      this.listeners.get(env.event)?.forEach((fn) => fn(env.payload));
    } catch {
      /* ignore malformed frames */
    }
  }
}
