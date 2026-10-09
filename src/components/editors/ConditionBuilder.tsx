import { Plus, Trash2, FolderPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CONDITION_LABELS, targetOptions } from "@/services/conditionEngine";
import { uid } from "@/services/caseFactory";
import type { CaseBundle, Condition, ConditionGroup, ConditionKind, ConditionRule } from "@/types";
import { cn } from "@/lib/utils";

const KINDS = Object.keys(CONDITION_LABELS) as ConditionKind[];

function RuleRow({ rule, bundle, onChange, onRemove }: { rule: ConditionRule; bundle: CaseBundle; onChange: (r: ConditionRule) => void; onRemove: () => void }) {
  const opts = targetOptions(bundle, rule.kind);
  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-md border border-border bg-background px-2 py-1.5">
      <button onClick={() => onChange({ ...rule, negate: !rule.negate })} className={cn("rounded-sm px-1.5 py-0.5 font-mono text-[10px]", rule.negate ? "bg-crimson-soft text-crimson" : "text-muted-foreground hover:bg-accent")}>{rule.negate ? "NOT" : "IS"}</button>
      <Select value={rule.kind} onValueChange={(v) => onChange({ ...rule, kind: v as ConditionKind, targetId: "" })}>
        <SelectTrigger className="h-7 w-48 text-xs"><SelectValue /></SelectTrigger>
        <SelectContent>{KINDS.map((k) => <SelectItem key={k} value={k} className="text-xs">{CONDITION_LABELS[k]}</SelectItem>)}</SelectContent>
      </Select>
      <span className="font-mono text-[10px] text-muted-foreground">=</span>
      <Select value={rule.targetId} onValueChange={(v) => onChange({ ...rule, targetId: v })}>
        <SelectTrigger className={cn("h-7 min-w-48 flex-1 text-xs", !rule.targetId && "border-crimson/50")}><SelectValue placeholder="Select target…" /></SelectTrigger>
        <SelectContent>{opts.map((o) => <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>)}</SelectContent>
      </Select>
      <Button variant="ghost" size="icon" className="size-7" onClick={onRemove} aria-label="Remove condition"><Trash2 className="size-3" /></Button>
    </div>
  );
}

/** Recursive AND / OR / NOT condition editor. Reused by triggers, hotspots, hints, dialogue nodes and locations. */
export function ConditionBuilder({ value, bundle, onChange, depth = 0, onRemove }: { value: ConditionGroup; bundle: CaseBundle; onChange: (g: ConditionGroup) => void; depth?: number; onRemove?: () => void }) {
  const setChild = (i: number, c: Condition) => onChange({ ...value, children: value.children.map((x, j) => (j === i ? c : x)) });
  const removeChild = (i: number) => onChange({ ...value, children: value.children.filter((_, j) => j !== i) });
  const addRule = () => onChange({ ...value, children: [...value.children, { type: "rule", id: uid("r"), kind: "evidence_discovered", targetId: "" }] });
  const addGroup = () => onChange({ ...value, children: [...value.children, { type: "group", id: uid("g"), operator: "OR", children: [] }] });

  return (
    <div className={cn("space-y-1.5 rounded-md border p-2", depth === 0 ? "border-border bg-muted/30" : "border-dashed border-info/40 bg-info-soft/30")}>
      <div className="flex items-center gap-1.5">
        <span className="label-caps">{depth === 0 ? "IF" : "GROUP"}</span>
        <div className="flex rounded-sm border border-border bg-background p-0.5">
          {(["AND", "OR"] as const).map((op) => (
            <button key={op} onClick={() => onChange({ ...value, operator: op })} className={cn("rounded-[3px] px-2 py-0.5 font-mono text-[10px]", value.operator === op ? "bg-info text-primary-foreground" : "text-muted-foreground")}>{op}</button>
          ))}
        </div>
        <button onClick={() => onChange({ ...value, negate: !value.negate })} className={cn("rounded-sm border px-1.5 py-0.5 font-mono text-[10px]", value.negate ? "border-crimson/40 bg-crimson-soft text-crimson" : "border-border text-muted-foreground")}>NOT</button>
        <div className="ml-auto flex gap-1">
          <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px]" onClick={addRule}><Plus className="size-3" />Condition</Button>
          {depth < 2 && <Button variant="ghost" size="sm" className="h-6 px-2 text-[11px]" onClick={addGroup}><FolderPlus className="size-3" />Group</Button>}
          {onRemove && <Button variant="ghost" size="icon" className="size-6" onClick={onRemove}><Trash2 className="size-3" /></Button>}
        </div>
      </div>
      {value.children.length === 0 && <div className="px-1 py-1 text-[11px] text-muted-foreground">No conditions — always true.</div>}
      {value.children.map((c, i) => (
        <div key={c.id} className="flex items-start gap-1.5">
          {i > 0 && <span className="mt-2 w-8 shrink-0 text-center font-mono text-[10px] text-info">{value.operator}</span>}
          {i === 0 && value.children.length > 1 && <span className="w-8 shrink-0" />}
          <div className="flex-1">
            {c.type === "rule"
              ? <RuleRow rule={c} bundle={bundle} onChange={(r) => setChild(i, r)} onRemove={() => removeChild(i)} />
              : <ConditionBuilder value={c} bundle={bundle} depth={depth + 1} onChange={(g) => setChild(i, g)} onRemove={() => removeChild(i)} />}
          </div>
        </div>
      ))}
    </div>
  );
}

export const emptyGroup = (): ConditionGroup => ({ type: "group", id: uid("g"), operator: "AND", children: [] });
