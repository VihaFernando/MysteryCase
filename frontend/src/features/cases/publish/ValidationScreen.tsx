import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, CheckCircle2, ShieldCheck, XCircle, type LucideIcon } from "lucide-react";
import { useCaseDraft } from "@/features/cases/CaseDraftProvider";
import { Button } from "@/components/ui/button";
import { Panel, Stat } from "@/components/common/Page";
import { Pill, type Tone } from "@/components/common/StatusBadge";
import { sectionPath } from "@/constants/caseSections";
import { summarize, validateCase, type Severity, type ValidationResult } from "@/services/validation";
import { cn } from "@/lib/utils";

const SEVERITY: Record<Severity, { icon: LucideIcon; cls: string; tone: Tone; label: string }> = {
  error: { icon: XCircle, cls: "text-crimson", tone: "crimson", label: "Error" },
  warning: { icon: AlertTriangle, cls: "text-amber", tone: "amber", label: "Warning" },
  pass: { icon: CheckCircle2, cls: "text-success", tone: "success", label: "Pass" },
};

type Filter = "all" | Severity;

function ResultRow({ r, caseId }: { r: ValidationResult; caseId: string }) {
  const s = SEVERITY[r.severity];
  return (
    <li className="flex gap-3 px-4 py-3">
      <s.icon className={cn("mt-0.5 size-4 shrink-0", s.cls)} aria-label={s.label} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">{r.label}</span>
          <Pill tone={s.tone}>{s.label}</Pill>
          {r.messages.length > 1 && <span className="font-mono text-[10px] text-muted-foreground">{r.messages.length} issues</span>}
        </div>
        {r.messages.length > 0 && (
          <ul className="mt-1.5 space-y-0.5 text-xs text-muted-foreground">
            {r.messages.map((m, i) => <li key={i} className="flex gap-1.5"><span className={s.cls}>•</span>{m}</li>)}
          </ul>
        )}
      </div>
      {r.link && r.severity !== "pass" && (
        <Button variant="outline" size="sm" className="h-7 shrink-0 text-xs" asChild>
          <Link to={sectionPath(r.link)} params={{ caseId }}>Fix<ArrowRight className="size-3" /></Link>
        </Button>
      )}
    </li>
  );
}

export function ValidationScreen() {
  const { bundle } = useCaseDraft();
  const [filter, setFilter] = useState<Filter>("all");
  const results = useMemo(() => validateCase(bundle), [bundle]);
  const sum = summarize(results);

  const visible = results.filter((r) => filter === "all" || r.severity === filter);
  const categories = [...new Set(visible.map((r) => r.category))];
  const counts: Record<Filter, number> = { all: results.length, error: sum.errors, warning: sum.warnings, pass: sum.passed };

  return (
    <div className="space-y-5 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-display text-lg font-semibold"><ShieldCheck className="size-4" />Validation</h2>
          <p className="text-xs text-muted-foreground">Checks update live as you edit. Errors block publishing; warnings do not.</p>
        </div>
        <Button size="sm" variant={sum.canPublish ? "default" : "outline"} asChild>
          <Link to="/cases/$caseId/publish" params={{ caseId: bundle.case.id }}>Go to publish<ArrowRight className="size-3.5" /></Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Stat label="Health score" value={`${sum.score}%`} tone={sum.errors ? "crimson" : sum.warnings ? "amber" : "success"} sub={sum.canPublish ? "Ready to publish" : "Publishing blocked"} />
        <Stat label="Errors" value={sum.errors} tone={sum.errors ? "crimson" : undefined} />
        <Stat label="Warnings" value={sum.warnings} tone={sum.warnings ? "amber" : undefined} />
        <Stat label="Passed" value={sum.passed} tone="success" />
      </div>

      <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter results">
        {(["all", "error", "warning", "pass"] as const).map((f) => (
          <button key={f} role="tab" aria-selected={filter === f} onClick={() => setFilter(f)}
            className={cn("rounded-md border px-2.5 py-1 text-xs capitalize transition-colors", filter === f ? "border-amber/60 bg-accent font-medium" : "border-border text-muted-foreground hover:text-foreground")}>
            {f === "all" ? "All" : f === "pass" ? "Passed" : `${f}s`} <span className="ml-1 font-mono text-[10px]">{counts[f]}</span>
          </button>
        ))}
      </div>

      {visible.length === 0 && <div className="rounded-md border border-dashed border-border py-10 text-center text-xs text-muted-foreground">No checks in this filter.</div>}
      {categories.map((cat) => (
        <Panel key={cat} title={cat} bodyClassName="p-0">
          <ul className="divide-y divide-border">
            {visible.filter((r) => r.category === cat).map((r) => <ResultRow key={r.id} r={r} caseId={bundle.case.id} />)}
          </ul>
        </Panel>
      ))}
    </div>
  );
}
