import { cn } from "@/lib/utils";
import type { CaseStatus, Difficulty } from "@/types";

export type Tone = "neutral" | "crimson" | "amber" | "info" | "success" | "violet";

const toneClass: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground border-border",
  crimson: "bg-crimson-soft text-crimson border-crimson/30",
  amber: "bg-amber-soft text-amber border-amber/30",
  info: "bg-info-soft text-info border-info/30",
  success: "bg-success-soft text-success border-success/30",
  violet: "bg-violet-soft text-violet border-violet/30",
};

export function Pill({ tone = "neutral", children, className, dot }: { tone?: Tone; children: React.ReactNode; className?: string; dot?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-sm border px-1.5 py-0.5 font-mono text-[10.5px] font-medium uppercase tracking-wide whitespace-nowrap", toneClass[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export const STATUS_TONE: Record<CaseStatus, Tone> = { draft: "neutral", review: "violet", scheduled: "info", published: "success", archived: "neutral" };

export function CaseStatusBadge({ status }: { status: CaseStatus }) {
  return <Pill tone={STATUS_TONE[status]} dot>{status}</Pill>;
}

const DIFF_TONE: Record<Difficulty, Tone> = { easy: "success", medium: "amber", hard: "crimson", expert: "crimson" };
export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  const bars = { easy: 1, medium: 2, hard: 3, expert: 4 }[difficulty];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs capitalize">
      <span className="flex gap-0.5">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={cn("h-2.5 w-1 rounded-[1px]", i <= bars ? (DIFF_TONE[difficulty] === "success" ? "bg-success" : DIFF_TONE[difficulty] === "amber" ? "bg-amber" : "bg-crimson") : "bg-border")} />
        ))}
      </span>
      {difficulty}
    </span>
  );
}
