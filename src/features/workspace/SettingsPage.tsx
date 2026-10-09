import { useState } from "react";
import { Moon, RotateCcw, Sun } from "lucide-react";
import { useTheme } from "@/app/providers/ThemeProvider";
import { config, STORAGE_KEYS } from "@/constants/config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, PageHeader, Panel } from "@/components/common/Page";
import { Pill } from "@/components/common/StatusBadge";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";

export function SettingsPage() {
  const { theme, toggle } = useTheme();
  const [confirm, setConfirm] = useState(false);

  const reset = () => {
    try { window.localStorage.removeItem(STORAGE_KEYS.db); window.localStorage.removeItem(STORAGE_KEYS.previewProgress); } catch { /* storage unavailable */ }
    window.location.reload();
  };

  return (
    <div className="max-w-3xl space-y-5 p-6">
      <PageHeader title="Settings" subtitle="Workspace preferences and connection details." />
      <Panel title="Appearance">
        <div className="flex items-center justify-between">
          <div><div className="text-sm font-medium">Theme</div><div className="text-xs text-muted-foreground">Currently {theme}.</div></div>
          <Button variant="outline" size="sm" onClick={toggle}>{theme === "dark" ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}Switch to {theme === "dark" ? "light" : "dark"}</Button>
        </div>
      </Panel>
      <Panel title="Connection" actions={<Pill tone={config.dataSource === "api" ? "success" : "amber"}>{config.dataSource === "api" ? "Live API" : "Demo data"}</Pill>}>
        <div className="grid gap-3">
          <Field label="API URL" hint="Set VITE_API_URL to connect a backend."><Input readOnly value={config.apiUrl || "Not configured — using local demo data"} /></Field>
          <Field label="WebSocket URL" hint="Set VITE_WS_URL for realtime events."><Input readOnly value={config.wsUrl || "Not configured — using simulated events"} /></Field>
          <Field label="Environment"><Input readOnly value={config.appEnv} /></Field>
          <Field label="Autosave" hint="Case edits are saved 1.5 seconds after you stop typing."><Input readOnly value="1.5 seconds" /></Field>
        </div>
      </Panel>
      <Panel title="Demo data">
        <div className="flex items-center justify-between gap-4">
          <div><div className="text-sm font-medium">Reset demo data</div><div className="text-xs text-muted-foreground">Discards every local change and restores the original demo cases. Cannot be undone.</div></div>
          <Button variant="outline" size="sm" className="text-crimson" onClick={() => setConfirm(true)}><RotateCcw className="size-3.5" />Reset</Button>
        </div>
      </Panel>
      <ConfirmDialog open={confirm} onOpenChange={setConfirm} title="Reset all demo data?" description="All cases, media, users and logs in this browser return to their original state." destructive confirmLabel="Reset" onConfirm={reset} />
    </div>
  );
}
