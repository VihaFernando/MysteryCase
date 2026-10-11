import { useWebSocket } from "@/websocket/WebSocketProvider";
import type { ConnectionStatus as Status } from "@/websocket/types";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { config } from "@/constants/config";

const META: Record<Status, { label: string; dot: string; text: string }> = {
  connected: { label: "Connected", dot: "bg-success", text: "text-success" },
  connecting: { label: "Connecting", dot: "bg-amber animate-pulse", text: "text-amber" },
  reconnecting: { label: "Reconnecting", dot: "bg-amber animate-pulse", text: "text-amber" },
  offline: { label: "Offline", dot: "bg-muted-foreground", text: "text-muted-foreground" },
};

/** Reusable realtime connection indicator. Reflects WebSocketClient status; UI never blocks on it. */
export function ConnectionStatus({ compact }: { compact?: boolean }) {
  const { status, client, isMock } = useWebSocket();
  const m = META[status];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn("flex items-center gap-2 rounded-md border border-border px-2 py-1 text-xs hover:bg-accent", m.text)}>
        <span className={cn("size-2 rounded-full", m.dot)} />
        {!compact && m.label}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="text-xs">
          Realtime: {m.label}
          <div className="mt-1 font-mono text-[10px] font-normal text-muted-foreground">{isMock ? "Mock adapter (no VITE_WS_URL)" : config.wsUrl}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => client?.reconnect()}>Reconnect</DropdownMenuItem>
        <DropdownMenuItem onClick={() => client?.disconnect()}>Go offline</DropdownMenuItem>
        <DropdownMenuItem onClick={() => client?.connect()}>Connect</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
