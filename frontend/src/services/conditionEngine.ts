import type { CaseBundle, Condition, ConditionGroup, ConditionKind } from "@/types";

/** Player-state snapshot used for evaluating conditions in Preview & Testing. */
export interface PlayerState {
  evidence: string[];
  clues: string[];
  interviewsCompleted: string[];
  questionsAnswered: string[];
  locationsVisited: string[];
  suspectsInterviewed: string[];
  timelineDiscovered: string[];
  choices: string[];
  progress: number;
}

export const emptyPlayerState = (): PlayerState => ({
  evidence: [], clues: [], interviewsCompleted: [], questionsAnswered: [], locationsVisited: [], suspectsInterviewed: [], timelineDiscovered: [], choices: [], progress: 0,
});

const lookup: Record<ConditionKind, (s: PlayerState, id: string) => boolean> = {
  evidence_discovered: (s, id) => s.evidence.includes(id),
  clue_discovered: (s, id) => s.clues.includes(id),
  interview_completed: (s, id) => s.interviewsCompleted.includes(id),
  question_answered: (s, id) => s.questionsAnswered.includes(id),
  location_visited: (s, id) => s.locationsVisited.includes(id),
  suspect_interviewed: (s, id) => s.suspectsInterviewed.includes(id),
  timeline_event_discovered: (s, id) => s.timelineDiscovered.includes(id),
  player_choice: (s, id) => s.choices.includes(id),
  case_progress: (s, id) => s.progress >= Number(id || 0),
};

export function evaluate(cond: Condition | undefined, state: PlayerState): boolean {
  if (!cond) return true;
  let result: boolean;
  if (cond.type === "rule") result = lookup[cond.kind](state, cond.targetId);
  else if (cond.children.length === 0) result = true;
  else result = cond.operator === "AND" ? cond.children.every((c) => evaluate(c, state)) : cond.children.some((c) => evaluate(c, state));
  return cond.negate ? !result : result;
}

export const CONDITION_LABELS: Record<ConditionKind, string> = {
  evidence_discovered: "Evidence discovered",
  clue_discovered: "Clue discovered",
  interview_completed: "Interview completed",
  question_answered: "Question answered",
  location_visited: "Location visited",
  suspect_interviewed: "Suspect interviewed",
  timeline_event_discovered: "Timeline event discovered",
  player_choice: "Player choice",
  case_progress: "Case progress ≥ %",
};

/** Options for the target select of each condition kind. */
export function targetOptions(bundle: CaseBundle, kind: ConditionKind): Array<{ value: string; label: string }> {
  switch (kind) {
    case "evidence_discovered": return bundle.evidence.map((e) => ({ value: e.id, label: `${e.code} · ${e.name}` }));
    case "clue_discovered": return bundle.clues.map((c) => ({ value: c.id, label: `${c.code} · ${c.title}` }));
    case "interview_completed": return bundle.interviews.map((i) => ({ value: i.id, label: `${i.code} · ${i.title}` }));
    case "question_answered": return bundle.interviews.flatMap((i) => i.nodes.filter((n) => n.type === "question").map((n) => ({ value: n.id, label: `${i.code} · ${n.text}` })));
    case "location_visited": return bundle.locations.map((l) => ({ value: l.id, label: l.name }));
    case "suspect_interviewed": return bundle.suspects.map((s) => ({ value: s.id, label: s.name }));
    case "timeline_event_discovered": return bundle.timeline.map((t) => ({ value: t.id, label: `${t.time} · ${t.title}` }));
    case "player_choice": return bundle.interviews.flatMap((i) => i.edges.filter((e) => e.label).map((e) => ({ value: e.id, label: `${i.code} · ${e.label}` })));
    case "case_progress": return [25, 50, 60, 75, 90].map((p) => ({ value: String(p), label: `${p}%` }));
  }
}

export function labelFor(bundle: CaseBundle, kind: ConditionKind, id: string): string {
  return targetOptions(bundle, kind).find((o) => o.value === id)?.label ?? (id || "—");
}

export function describe(cond: Condition | undefined, bundle: CaseBundle): string {
  if (!cond) return "Always";
  if (cond.type === "rule") return `${cond.negate ? "NOT " : ""}${CONDITION_LABELS[cond.kind]} = ${labelFor(bundle, cond.kind, cond.targetId)}`;
  const inner = cond.children.map((c) => describe(c, bundle)).join(` ${cond.operator} `);
  return `${cond.negate ? "NOT " : ""}(${inner || "empty"})`;
}

export function collectRefs(cond: ConditionGroup | undefined): Array<{ kind: ConditionKind; id: string }> {
  if (!cond) return [];
  return cond.children.flatMap((c) => (c.type === "rule" ? [{ kind: c.kind, id: c.targetId }] : collectRefs(c)));
}
