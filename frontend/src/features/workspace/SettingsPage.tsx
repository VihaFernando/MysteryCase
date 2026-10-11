import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/app/providers/ThemeProvider";
import { config } from "@/constants/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, PageHeader, Panel } from "@/components/common/Page";
import { Pill } from "@/components/common/StatusBadge";

export function SettingsPage() {
  const { theme, toggle } = useTheme();
  return (
    <div className="max-w-3xl space-y-5 p-6">
      <PageHeader title="Settings" subtitle="Workspace preferences and connection details." />
      <Panel title="Appearance">
        <div className="flex items-center justify-between">
          <div><div className="text-sm font-medium">Theme</div><div className="text-xs text-muted-foreground">Currently {theme}.</div></div>
          <Button variant="outline" size="sm" onClick={toggle}>{theme === "dark" ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}Switch to {theme === "dark" ? "light" : "dark"}</Button>
        </div>
      </Panel>
      <Panel title="Connection" actions={<Pill tone={config.apiUrl ? "success" : "amber"}>{config.apiUrl ? "Live API" : "Not connected"}</Pill>}>
        <div className="grid gap-3">
          <Field label="API URL" hint="Set VITE_API_URL to connect a backend."><Input readOnly value={config.apiUrl || "Not configured — set VITE_API_URL"} /></Field>
          <Field label="WebSocket URL" hint="Set VITE_WS_URL for realtime events."><Input readOnly value={config.wsUrl || "Not configured — using simulated events"} /></Field>
          <Field label="Environment"><Input readOnly value={config.appEnv} /></Field>
          <Field label="Autosave" hint="Case edits are saved 1.5 seconds after you stop typing."><Input readOnly value="1.5 seconds" /></Field>
        </div>
      </Panel>
    </div>
  );
}
