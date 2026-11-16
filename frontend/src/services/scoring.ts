import type { CaseBundle } from "@/types";
import { emptyPlayerState, evaluate, type PlayerState } from "./conditionEngine";

export interface Accusation {
  killerId: string;
  motive: string;
  method: string;
  evidenceIds: string[];
  timelineOrder: string[];
  /** Objections beaten out of those raised, when the accused got to answer back. Replaces the evidence checklist. */
  rebuttals?: { won: number; total: number } | undefined;
  mistakes?: number | undefined;
  /** What the accused said when the case against them fell apart. */
  failText?: string | undefined;
}

export const MISTAKE_COST = 10;

export interface ScoreBreakdown {
  total: number;
  max: number;
  lines: Array<{ label: string; points: number }>;
  correct: boolean;
  ending?: { title: string; text: string };
}

export function scoreAccusation(b: CaseBundle, a: Accusation, hintPenalty: number, minutes: number, state: PlayerState = emptyPlayerState()): ScoreBreakdown {
  const s = b.solution;
  const sc = s.scoring;
  const lines: ScoreBreakdown["lines"] = [];
  const killer = a.killerId === s.killerId;
  const norm = (x: string) => x.trim().toLowerCase();
  const motive = norm(a.motive) === norm(s.motive) || s.acceptableAlternatives.some((alt) => norm(alt) === norm(a.motive));
  const method = norm(a.method).includes(norm(s.weapon)) || norm(a.method) === norm(s.method);
  lines.push({ label: "Correct killer", points: killer ? sc.correctKiller : -sc.wrongAccusationPenalty });
  if (motive) lines.push({ label: "Correct motive", points: sc.correctMotive });
  if (method) lines.push({ label: "Correct method", points: sc.correctMethod });
  const proofMax = s.requiredEvidenceIds.length * sc.perRequiredEvidence;
  const evHits = a.evidenceIds.filter((id) => s.requiredEvidenceIds.includes(id)).length;
  if (a.rebuttals) { if (killer && a.rebuttals.won) lines.push({ label: `Objections beaten (${a.rebuttals.won}/${a.rebuttals.total})`, points: Math.round((a.rebuttals.won / a.rebuttals.total) * proofMax) }); }
  else if (evHits) lines.push({ label: `Required evidence (${evHits}/${s.requiredEvidenceIds.length})`, points: evHits * sc.perRequiredEvidence });
  const correctOrder = s.correctTimelineIds;
  const userOrder = a.timelineOrder.filter((id) => correctOrder.includes(id));
  let inOrder = 0;
  userOrder.forEach((id, i) => { if (correctOrder.filter((c) => userOrder.includes(c))[i] === id) inOrder++; });
  const tlRatio = userOrder.length ? inOrder / userOrder.length : 0;
  if (tlRatio > 0) lines.push({ label: `Timeline accuracy ${Math.round(tlRatio * 100)}%`, points: Math.round(tlRatio * sc.timelineAccuracy) });
  if (minutes < sc.timeBonusUnderMinutes && killer) lines.push({ label: "Time bonus", points: sc.timeBonus });
  if (hintPenalty) lines.push({ label: "Hints used", points: -hintPenalty });
  if (a.mistakes) lines.push({ label: `Missteps (${a.mistakes})`, points: -a.mistakes * MISTAKE_COST });
  const total = Math.max(0, Math.min(sc.maxScore, lines.reduce((t, l) => t + l.points, 0)));
  const proven = a.rebuttals ? a.rebuttals.won === a.rebuttals.total : s.requiredEvidenceIds.every((id) => a.evidenceIds.includes(id));
  const outcome = !killer ? "incorrect" : motive && method && proven ? "solved" : "incomplete";
  const base = b.storyEndings?.find((e) => e.outcome === outcome && evaluate(e.condition, state)) ?? b.endings?.[outcome];
  const extra = [outcome !== "solved" && a.failText, ...(outcome === "solved" ? (b.epilogues ?? []).filter((e) => evaluate(e.condition, state)).map((e) => e.text) : [])].filter(Boolean);
  const ending = base && { title: base.title, text: [base.text, ...extra].join("\n\n") };
  return { total, max: sc.maxScore, lines, correct: killer, ...(ending && { ending }) };
}
