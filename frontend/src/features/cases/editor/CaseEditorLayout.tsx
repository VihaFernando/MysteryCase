import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, CloudOff, Eye, Globe, Loader2, Save, ShieldCheck } from "lucide-react";
import { useCaseBundle } from "@/hooks/queries";
import { CaseDraftProvider, useCaseDraft, type SaveState } from "../CaseDraftProvider";
import { CASE_SECTIONS } from "@/constants/caseSections";
import { Button } from "@/components/ui/button";
import { CaseStatusBadge } from "@/components/common/StatusBadge";
import { EmptyState } from "@/components/common/Page";
import { Skeleton } from "@/components/ui/skeleton";
import { fmtTime } from "@/utils/format";
import { cn } from "@/lib/utils";
import { summarize, validateCase } from "@/services/validation";
import { toast } from "sonner";
import { FileQuestion } from "lucide-react";

function AutosaveIndicator({ state, last }: { state: SaveState; last: Date | null }) {
  const [, tick] = useState(0);
  useEffect(() => { const t = setInterval(() => tick((x) => x + 1), 15000); return () => clearInterval(t); }, []);
  const recent = last && Date.now() - last.getTime() < 20000;
  const map: Record<SaveState, { icon: typeof Save; text: string; cls: string }> = {
    saving: { icon: Loader2, text: "Saving…", cls: "text-muted-foreground [&>svg]:animate-spin" },
    saved: { icon: CheckCircle2, text: recent ? "Saved just now" : `Last saved ${last ? fmtTime(last) : "—"}`, cls: "text-success" },
    dirty: { icon: AlertTriangle, text: "Unsaved changes", cls: "text-amber" },
    error: { icon: CloudOff, text: "Save failed — retrying on next edit", cls: "text-crimson" },
  };
  const m = map[state];
  return <span className={cn("flex items-center gap-1.5 text-[11px]", m.cls)}><m.icon className="size-3" />{m.text}</span>;
}

function EditorChrome() {
  const { bundle, saveNow, saveState, lastSavedAt } = useCaseDraft();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const c = bundle.case;
  const sum = summarize(validateCase(bundle));

  return (
    <div className="flex min-h-full flex-col">
      <div className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3 px-6 pt-3">
          <img src={c.coverImage} alt="" className="size-9 rounded-sm object-cover" />
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 font-display text-lg font-semibold leading-tight">
              <span className="font-mono text-sm text-muted-foreground">{c.code}</span>
              <span className="text-muted-foreground">—</span>
              <span className="truncate">{c.title}</span>
            </h1>
            <div className="flex items-center gap-3">
              <CaseStatusBadge status={c.status} />
              <span className="font-mono text-[11px] text-muted-foreground">v{c.version}</span>
              <AutosaveIndicator state={saveState} last={lastSavedAt} />
            </div>
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild><Link to="/preview/$caseId" params={{ caseId: c.id }}><Eye className="size-3.5" />Preview in App</Link></Button>
            <Button variant="outline" size="sm" onClick={async () => { await saveNow(); toast.success("Draft saved"); }} disabled={saveState === "saving"}><Save className="size-3.5" />Save Draft</Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/cases/$caseId/validation" params={{ caseId: c.id }}>
                <ShieldCheck className="size-3.5" />Validate Case
                {sum.errors > 0 ? <span className="rounded-sm bg-crimson-soft px-1 font-mono text-[10px] text-crimson">{sum.errors}</span> : sum.warnings > 0 ? <span className="rounded-sm bg-amber-soft px-1 font-mono text-[10px] text-amber">{sum.warnings}</span> : null}
              </Link>
            </Button>
            <Button size="sm" onClick={() => navigate({ to: "/cases/$caseId/publish", params: { caseId: c.id } })}><Globe className="size-3.5" />Publish</Button>
          </div>
        </div>
        <nav className="scrollbar-thin mt-2 flex gap-0.5 overflow-x-auto px-4">
          {CASE_SECTIONS.map((s, i) => {
            const active = path.endsWith(`/${s.key}`);
            return (
              <Link key={s.key} to={s.to} params={{ caseId: c.id }}
                className={cn("flex shrink-0 items-center gap-1.5 border-b-2 px-2.5 py-2 text-xs transition-colors", active ? "border-amber font-medium text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
                <span className={cn("font-mono text-[10px]", active ? "text-amber" : "opacity-60")}>{i + 1}</span>{s.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex-1"><Outlet /></div>
    </div>
  );
}

export function CaseEditorLayout({ caseId }: { caseId: string }) {
  const { data, isLoading } = useCaseBundle(caseId);
  if (isLoading) return <div className="space-y-3 p-6"><Skeleton className="h-12 w-1/2" /><Skeleton className="h-8 w-full" /><Skeleton className="h-96 w-full" /></div>;
  if (!data) return <div className="p-6"><EmptyState icon={FileQuestion} title="Case not found" body="It may have been deleted." action={<Button size="sm" asChild><Link to="/cases">Back to cases</Link></Button>} /></div>;
  return <CaseDraftProvider key={caseId} initial={data}><EditorChrome /></CaseDraftProvider>;
}
