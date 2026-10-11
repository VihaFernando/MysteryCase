import type { CaseBundle } from "@/types";

export interface Accusation {
  killerId: string;
  motive: string;
  method: string;
  evidenceIds: string[];
  timelineOrder: string[];
}

export interface ScoreBreakdown {
  total: number;
  max: number;
  lines: Array<{ label: string; points: number }>;
  correct: boolean;
}

export function scoreAccusation(b: CaseBundle, a: Accusation, hintPenalty: number, minutes: number): ScoreBreakdown {
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
  const evHits = a.evidenceIds.filter((id) => s.requiredEvidenceIds.includes(id)).length;
  if (evHits) lines.push({ label: `Required evidence (${evHits}/${s.requiredEvidenceIds.length})`, points: evHits * sc.perRequiredEvidence });
  const correctOrder = s.correctTimelineIds;
  const userOrder = a.timelineOrder.filter((id) => correctOrder.includes(id));
  let inOrder = 0;
  userOrder.forEach((id, i) => { if (correctOrder.filter((c) => userOrder.includes(c))[i] === id) inOrder++; });
  const tlRatio = userOrder.length ? inOrder / userOrder.length : 0;
  if (tlRatio > 0) lines.push({ label: `Timeline accuracy ${Math.round(tlRatio * 100)}%`, points: Math.round(tlRatio * sc.timelineAccuracy) });
  if (minutes < sc.timeBonusUnderMinutes && killer) lines.push({ label: "Time bonus", points: sc.timeBonus });
  if (hintPenalty) lines.push({ label: "Hints used", points: -hintPenalty });
  const total = Math.max(0, Math.min(sc.maxScore, lines.reduce((t, l) => t + l.points, 0)));
  return { total, max: sc.maxScore, lines, correct: killer };
}
