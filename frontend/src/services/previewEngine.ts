import { evaluate, type PlayerState } from "./conditionEngine";
import type { CaseBundle, Deduction, DialogueNode, Evidence, Hotspot, Interview, InspectionRequirement, Reaction, Scene, SearchTool, Statement, StatementReply } from "@/types";

/** Everything the player preview remembers about a play-through. */
export interface PreviewState extends PlayerState {
  /** Entities unlocked by triggers or dialogue "unlock" nodes (interviews, locations, questions…). */
  unlocked: string[];
  /** Inspection stage IDs the player has viewed. */
  stagesDone: string[];
  /** "stageId:index" keys for completed player_action requirements. */
  actionsDone: string[];
  /** Trigger IDs that have already fired (so notifications show once). */
  firedTriggers: string[];
  hintsUsed: string[];
  startedAt: number;
  /** Hotspots the player has noticed (they stay marked in the room). */
  found: string[];
  /** Containers opened, including ones whose lock was solved. */
  opened: string[];
  /** Evidence details, document lines ("evidenceId:line") and comparisons ("a+b") worked out. */
  examined: string[];
  /** Statements proven false. */
  exposed: string[];
  /** Linked deductions. */
  deductions: string[];
  /** Wrong challenges left per interview. */
  patience: Record<string, number>;
  /** Interview → how much the player knew when the person stopped answering challenges. */
  lockout: Record<string, number>;
  /** Wrong challenges, wrong links, wrong flags and room scans. Costs score. */
  mistakes: number;
}

export const initialPreviewState = (): PreviewState => ({
  evidence: [], clues: [], interviewsCompleted: [], questionsAnswered: [], locationsVisited: [], suspectsInterviewed: [], timelineDiscovered: [], choices: [], progress: 0,
  unlocked: [], stagesDone: [], actionsDone: [], firedTriggers: [], hintsUsed: [], startedAt: Date.now(),
  found: [], opened: [], examined: [], exposed: [], deductions: [], patience: {}, lockout: {}, mistakes: 0,
});

const add = (list: string[], ...ids: Array<string | undefined>) => {
  const fresh = ids.filter((i): i is string => !!i && !list.includes(i));
  return fresh.length ? [...list, ...fresh] : list;
};

/** Case progress as the share of evidence and clues the player has found. */
export function progressOf(b: CaseBundle, s: PreviewState) {
  const total = b.evidence.length + b.clues.length;
  return total ? Math.round(((s.evidence.length + s.clues.length) / total) * 100) : 0;
}

/** Records evidence and its related timeline events/clues as found. */
export function collectEvidence(b: CaseBundle, s: PreviewState, evidenceId: string): PreviewState {
  const ev = b.evidence.find((e) => e.id === evidenceId);
  if (!ev) return s;
  return { ...s, evidence: add(s.evidence, evidenceId), timelineDiscovered: add(s.timelineDiscovered, ...ev.relatedTimelineIds) };
}

export const collectClue = (s: PreviewState, clueId?: string): PreviewState => (clueId ? { ...s, clues: add(s.clues, clueId) } : s);

/** Applies every enabled trigger whose condition holds until nothing changes. Returns the new state and notification texts. */
export function applyTriggers(b: CaseBundle, state: PreviewState): { state: PreviewState; notifications: string[] } {
  let s: PreviewState = { ...state, progress: progressOf(b, state) };
  const notifications: string[] = [];
  for (let pass = 0; pass < 10; pass++) {
    let changed = false;
    for (const t of b.triggers) {
      if (!t.enabled || !evaluate(t.condition, s)) continue;
      const first = !s.firedTriggers.includes(t.id);
      const before = s;
      for (const a of t.actions) {
        switch (a.kind) {
          case "unlock_clue":
          case "reveal_contradiction": s = collectClue(s, a.targetId); break;
          case "unlock_timeline_event": s = { ...s, timelineDiscovered: add(s.timelineDiscovered, a.targetId) }; break;
          case "show_notification": if (first && a.label) notifications.push(a.label); break;
          default: s = { ...s, unlocked: add(s.unlocked, a.targetId) };
        }
      }
      if (first) s = { ...s, firedTriggers: [...s.firedTriggers, t.id] };
      if (s !== before) changed = true;
    }
    s = { ...s, progress: progressOf(b, s) };
    if (!changed) break;
  }
  return { state: s, notifications };
}

export const isInterviewOpen = (i: Interview, s: PreviewState) => i.unlockedByDefault || s.unlocked.includes(i.id) || evaluate(i.unlockCondition, s);
export const isLocationOpen = (b: CaseBundle, locationId: string, s: PreviewState) => {
  const l = b.locations.find((x) => x.id === locationId);
  return !l || l.unlockedByDefault || s.unlocked.includes(l.id) || evaluate(l.unlockCondition, s);
};
export const isNodeOpen = (n: DialogueNode, s: PreviewState) => s.unlocked.includes(n.id) || evaluate(n.condition, s);

/* ───────────────────────── Hotspots & inspection ───────────────────────── */

export type HotspotStatus = "open" | "locked" | "needs_item" | "hidden";

export function hotspotStatus(h: Hotspot, state: PreviewState): HotspotStatus {
  if (!evaluate(h.unlockCondition, state)) return h.discoveryState === "hidden" ? "hidden" : "locked";
  if (h.requiredItemId && !state.evidence.includes(h.requiredItemId)) return "needs_item";
  if (h.discoveryState === "locked") return "locked";
  return "open";
}

/** What tapping an open hotspot gives the player. */
export function collectFromHotspot(b: CaseBundle, s: PreviewState, h: Hotspot): PreviewState {
  return collectClue(h.evidenceId ? collectEvidence(b, s, h.evidenceId) : s, h.clueId);
}

/** Requirements of an inspection stage that are not yet satisfied. */
export function unmetRequirements(ev: Evidence, stageIndex: number, s: PreviewState): Array<{ req: InspectionRequirement; index: number }> {
  const stage = ev.inspections[stageIndex];
  if (!stage) return [];
  return stage.requirements
    .map((req, index) => ({ req, index }))
    .filter(({ req, index }) => {
      switch (req.kind) {
        case "previous_stage": return !(stageIndex === 0 || s.stagesDone.includes(ev.inspections[stageIndex - 1]!.id));
        case "clue": return !!req.targetId && !s.clues.includes(req.targetId);
        case "evidence": return !!req.targetId && !s.evidence.includes(req.targetId);
        case "location": return !!req.targetId && !s.locationsVisited.includes(req.targetId);
        case "player_action": return !s.actionsDone.includes(`${stage.id}:${index}`);
      }
    });
}

/** Marks an inspection stage as viewed and grants the clue it reveals. */
export const completeStage = (s: PreviewState, ev: Evidence, stageIndex: number): PreviewState => {
  const stage = ev.inspections[stageIndex];
  return stage ? collectClue({ ...s, stagesDone: add(s.stagesDone, stage.id) }, stage.revealsClueId) : s;
};

/* ───────────────────────── Dialogue walker ───────────────────────── */

export interface DialogueLine {
  kind: "player" | "npc" | "system";
  speaker?: string | undefined;
  text: string;
  reaction?: Reaction | undefined;
  contradiction?: boolean | undefined;
}

export type DialogueStop =
  | { type: "choices"; menuId: string; options: Array<{ nodeId: string; label: string; locked: boolean; asked: boolean }> }
  | { type: "present"; nodeId: string; evidenceId?: string | undefined; menuId?: string | undefined }
  | { type: "end" }
  | { type: "dead" };

export interface DialogueStep { lines: DialogueLine[]; state: PreviewState; stop: DialogueStop }

const SIDE: DialogueNode["type"][] = ["clue", "unlock"];

/**
 * Walks an interview graph from `fromId` until the player must act.
 * `resume` skips the node's own content (used after a choice menu or evidence presentation).
 */
export function walkDialogue(b: CaseBundle, interview: Interview, fromId: string, input: PreviewState, resume = false, menu?: string): DialogueStep {
  const nodes = new Map(interview.nodes.map((n) => [n.id, n]));
  const lines: DialogueLine[] = [];
  let s = input;
  let cur = fromId;
  let skipSelf = resume;
  let menuId = menu; // last question menu, so topics that run out return to it instead of dead-ending

  const applyEffects = (n: DialogueNode) => {
    s = collectClue(s, n.clueId);
    if (n.type === "unlock" && n.unlockTargetId) s = { ...s, unlocked: add(s.unlocked, n.unlockTargetId) };
  };
  const optionFor = (nodeId: string, label?: string) => {
    const n = nodes.get(nodeId);
    return { nodeId, label: label || n?.text || nodeId, locked: n ? !isNodeOpen(n, s) : true, asked: s.questionsAnswered.includes(nodeId) };
  };

  for (let guard = 0; guard < 200; guard++) {
    const node = nodes.get(cur);
    if (!node) return { lines, state: s, stop: { type: "dead" } };

    if (!skipSelf) {
      switch (node.type) {
        case "start": break;
        case "response":
        case "reaction":
          lines.push({ kind: "npc", speaker: node.speaker, text: node.text, reaction: node.reaction, contradiction: node.isContradiction });
          applyEffects(node);
          break;
        case "question":
          lines.push({ kind: "player", speaker: node.speaker ?? "You", text: node.text });
          s = { ...s, questionsAnswered: add(s.questionsAnswered, node.id) };
          break;
        case "clue":
        case "unlock":
          lines.push({ kind: "system", text: node.text });
          applyEffects(node);
          break;
        case "present_evidence":
          return { lines, state: s, stop: { type: "present", nodeId: node.id, evidenceId: node.evidenceId, menuId } };
        case "end":
          if (cur !== fromId && menuId) { // reached automatically: keep talking while open questions remain
            const left = interview.edges.some((e) => { const t = nodes.get(e.target); return e.source === menuId && t?.type === "question" && isNodeOpen(t, s) && !s.questionsAnswered.includes(t.id); });
            if (left) { cur = menuId; skipSelf = true; continue; }
          }
          s = { ...s, interviewsCompleted: add(s.interviewsCompleted, interview.id), suspectsInterviewed: add(s.suspectsInterviewed, interview.suspectId) };
          return { lines, state: s, stop: { type: "end" } };
        case "choice": break;
      }
    }
    skipSelf = false;

    const out = interview.edges.filter((e) => e.source === node.id);
    if (node.type === "choice") {
      menuId = node.id;
      return { lines, state: s, stop: { type: "choices", menuId: node.id, options: out.map((e) => optionFor(e.target, e.label)) } };
    }
    if (out.length === 0) {
      if (!menuId || menuId === node.id) return { lines, state: s, stop: { type: "dead" } };
      cur = menuId; skipSelf = true; continue; // topic exhausted: back to the questions
    }

    if (out.length === 1) {
      const target = nodes.get(out[0]!.target);
      if (!target) return { lines, state: s, stop: { type: "dead" } };
      if (!isNodeOpen(target, s)) return { lines, state: s, stop: { type: "dead" } };
      cur = target.id;
      continue;
    }

    // Several exits: side-effect nodes fire silently, anything else is the player's choice.
    const targets = out.map((e) => ({ edge: e, node: nodes.get(e.target) })).filter((t): t is { edge: typeof t.edge; node: DialogueNode } => !!t.node);
    const sides = targets.filter((t) => SIDE.includes(t.node.type));
    const main = targets.filter((t) => !SIDE.includes(t.node.type));
    sides.forEach((t) => {
      const seen = t.node.type === "unlock" ? !!t.node.unlockTargetId && s.unlocked.includes(t.node.unlockTargetId) : !!t.node.clueId && s.clues.includes(t.node.clueId);
      if (!seen) lines.push({ kind: "system", text: t.node.text }); // returning to this menu must not replay old discoveries
      applyEffects(t.node);
    });
    if (main.length === 0) { cur = sides[0]!.node.id; skipSelf = true; continue; }
    if (main.length === 1) { cur = main[0]!.node.id; continue; }
    menuId = node.id;
    return { lines, state: s, stop: { type: "choices", menuId: node.id, options: main.map((t) => optionFor(t.node.id, t.edge.label)) } };
  }
  return { lines, state: s, stop: { type: "dead" } };
}

/** Everything unlocked, for the debug "unlock all" button. */
export function unlockEverything(b: CaseBundle, s: PreviewState): PreviewState {
  return {
    ...s,
    evidence: b.evidence.map((e) => e.id),
    clues: b.clues.map((c) => c.id),
    interviewsCompleted: b.interviews.map((i) => i.id),
    suspectsInterviewed: b.suspects.map((x) => x.id),
    locationsVisited: b.locations.map((l) => l.id),
    timelineDiscovered: b.timeline.map((t) => t.id),
    questionsAnswered: b.interviews.flatMap((i) => i.nodes.filter((n) => n.type === "question").map((n) => n.id)),
    unlocked: [...b.interviews.map((i) => i.id), ...b.locations.map((l) => l.id)],
    progress: 100,
  };
}

/* ───────────────────────── Searching rooms ───────────────────────── */

export const isSceneOpen = (b: CaseBundle, sc: Scene, s: PreviewState) => isLocationOpen(b, sc.locationId, s) && evaluate(sc.unlockCondition, s);
export const childrenOf = (sc: Scene, h: Hotspot, s: PreviewState) => sc.hotspots.filter((c) => c.parentId === h.id && hotspotStatus(c, s) !== "hidden");
/** Everything in the room the player could still notice right now. */
export const searchable = (sc: Scene, s: PreviewState) => sc.hotspots.filter((h) => hotspotStatus(h, s) !== "hidden" && (!h.parentId || s.opened.includes(h.parentId)));

/** The spot under the player's finger, if the right tool is in hand. Coordinates are percentages; `aspect` is image height ÷ width. */
export function hotspotAt<T extends { x: number; y: number; radius?: number; tool?: SearchTool | undefined }>(spots: T[], tool: SearchTool | undefined, x: number, y: number, aspect = 0.75): T | undefined {
  return spots
    .filter((h) => h.tool === tool)
    .map((h) => ({ h, d: Math.hypot(h.x - x, (h.y - y) * aspect) }))
    .filter(({ h, d }) => d <= Math.max(h.radius ?? 0, 8))
    .sort((a, z) => a.d - z.d)[0]?.h;
}

export const hasLock = (h: Hotspot, s: PreviewState) => !!h.lock && !s.opened.includes(h.id);
export const tryLock = (h: Hotspot, code: string) => !!h.lock && h.lock.code.replace(/\D/g, "") === code.replace(/\D/g, "");

/** Noticing a spot: takes what is there and, for a container, opens it. Locked containers need `tryLock` first. */
export function searchHotspot(b: CaseBundle, s: PreviewState, h: Hotspot): PreviewState {
  if (hotspotStatus(h, s) !== "open") return s;
  const noted = { ...s, found: add(s.found, h.id) };
  return collectFromHotspot(b, { ...noted, opened: add(noted.opened, h.id) }, h);
}

/* ───────────────────────── Examining evidence ───────────────────────── */

const clueList = (s: PreviewState, ids: string[] | undefined) => (ids ?? []).reduce(collectClue, s);
export const evidenceLocked = (ev: Evidence, s: PreviewState) => !evaluate(ev.lockedUntil, s);

export function findDetail(s: PreviewState, ev: Evidence, detailId: string): PreviewState {
  const d = ev.details?.find((x) => x.id === detailId);
  return d ? clueList({ ...s, examined: add(s.examined, d.id) }, d.clueIds) : s;
}

/** Flags a line of a document. A line that does not matter costs a mistake. */
export function flagLine(s: PreviewState, ev: Evidence, line: number): { state: PreviewState; ok: boolean } {
  const key = `${ev.id}:${line}`;
  if (s.examined.includes(key)) return { state: s, ok: true };
  const hit = ev.document?.key.find((k) => k.line === line);
  const state = { ...s, examined: [...s.examined, key] };
  return hit ? { state: clueList(state, hit.clueIds), ok: true } : { state: { ...state, mistakes: s.mistakes + 1 }, ok: false };
}

export const compareKey = (a: string, b: string) => [a, b].sort().join("+");
export function compareEvidence(b: CaseBundle, s: PreviewState, aId: string, bId: string): { state: PreviewState; note?: string } {
  const pair = b.evidence.flatMap((e) => (e.compare ?? []).map((c) => ({ c, key: compareKey(e.id, c.withEvidenceId) }))).find((x) => x.key === compareKey(aId, bId));
  if (!pair) return { state: { ...s, mistakes: s.mistakes + 1 } };
  return { state: clueList({ ...s, examined: add(s.examined, pair.key) }, pair.c.clueIds), note: pair.c.note };
}

/* ───────────────────────── Interrogation ───────────────────────── */

export const knowledge = (s: PreviewState) => s.evidence.length + s.clues.length;
export const statementsOf = (iv: Interview, s: PreviewState) => (iv.testimony ?? []).filter((st) => evaluate(st.condition, s));
export const patienceOf = (iv: Interview, s: PreviewState) => s.patience[iv.id] ?? iv.patience ?? 3;
/** Out of patience, and nothing new learned since. */
export const refusesChallenges = (iv: Interview, s: PreviewState) => s.lockout[iv.id] === knowledge(s);
export type Verdict = "truth" | "doubt" | "lie";
/** The right call on a statement. */
export const statementKind = (st: Statement): Verdict => (st.contradictedBy?.length ? "lie" : st.doubt ? "doubt" : "truth");
export const statementResolved = (st: Statement, s: PreviewState) => (statementKind(st) === "truth" ? s.questionsAnswered.includes(st.id) : s.exposed.includes(st.id));

/** Things still held back ÷ things held back, across the whole testimony. 0 means broken. */
export function composure(iv: Interview, s: PreviewState) {
  const lies = (iv.testimony ?? []).filter((st) => statementKind(st) !== "truth");
  return { left: lies.filter((st) => !s.exposed.includes(st.id)).length, total: lies.length };
}
const reply = (s: PreviewState, r: StatementReply | undefined) => clueList(s, r?.clueIds);

export function hearTestimony(iv: Interview, s: PreviewState): PreviewState {
  return { ...s, interviewsCompleted: add(s.interviewsCompleted, iv.id), suspectsInterviewed: add(s.suspectsInterviewed, iv.suspectId) };
}

/** Taking a statement at face value: they go on talking. */
export const pressStatement = (s: PreviewState, st: Statement): PreviewState => reply({ ...s, questionsAnswered: add(s.questionsAnswered, st.id) }, st.press);

const misjudge = (iv: Interview, s: PreviewState): PreviewState => {
  const left = Math.max(0, patienceOf(iv, s) - 1);
  return { ...s, mistakes: s.mistakes + 1, patience: { ...s.patience, [iv.id]: left }, ...(left <= 0 && { lockout: { ...s.lockout, [iv.id]: knowledge(s) } }) };
};

/** Accusing them of holding back (`hit` says whether the accusation lands). A miss costs patience; running out stops accusations until the player learns something new. */
function confront(iv: Interview, input: PreviewState, st: Statement, hit: boolean, r: StatementReply | undefined): { state: PreviewState; ok: boolean } {
  let s = input;
  if (s.lockout[iv.id] !== undefined && !refusesChallenges(iv, s)) { // came back with something new: a fresh start
    const { [iv.id]: _l, ...lockout } = s.lockout;
    const { [iv.id]: _p, ...patience } = s.patience;
    s = { ...s, lockout, patience };
  }
  if (refusesChallenges(iv, s) || s.exposed.includes(st.id)) return { state: s, ok: false };
  return hit ? { state: reply({ ...s, exposed: [...s.exposed, st.id] }, r), ok: true } : { state: misjudge(iv, s), ok: false };
}

/** "Lie": presents an item against a statement. */
export const challengeStatement = (iv: Interview, s: PreviewState, st: Statement, itemId: string) => confront(iv, s, st, !!st.contradictedBy?.includes(itemId), st.exposed);

/** The player's read of a statement: Truth, Doubt, or Lie with proof. */
export function judgeStatement(iv: Interview, s: PreviewState, st: Statement, verdict: Verdict, itemId = ""): { state: PreviewState; ok: boolean } {
  if (verdict === "lie") return challengeStatement(iv, s, st, itemId);
  if (verdict === "doubt") return confront(iv, s, st, statementKind(st) === "doubt", st.doubt);
  const heard = pressStatement(s, st);
  return statementKind(st) === "truth" ? { state: heard, ok: true } : { state: misjudge(iv, heard), ok: false }; // believed a liar: they are happy to go on
}

/** Whether the statement's one-time decision is on the table. */
export const choiceOpen = (st: Statement, s: PreviewState) =>
  !!st.choices?.length && !st.choices.some((c) => s.choices.includes(c.id)) && (statementKind(st) !== "truth" ? s.exposed.includes(st.id) : s.questionsAnswered.includes(st.id));

export function chooseApproach(s: PreviewState, st: Statement, choiceId: string): PreviewState {
  const c = st.choices?.find((x) => x.id === choiceId);
  return c && choiceOpen(st, s) ? reply({ ...s, choices: [...s.choices, c.id] }, c) : s;
}

/* ───────────────────────── Deduction board ───────────────────────── */

export function tryDeduction(b: CaseBundle, s: PreviewState, clueIds: string[]): { state: PreviewState; deduction?: Deduction } {
  const same = (d: Deduction) => d.clueIds.length === clueIds.length && d.clueIds.every((id) => clueIds.includes(id));
  const deduction = (b.deductions ?? []).find((d) => !s.deductions.includes(d.id) && same(d));
  if (!deduction) return { state: { ...s, mistakes: s.mistakes + 1 } };
  return { state: collectClue({ ...s, deductions: [...s.deductions, deduction.id] }, deduction.conclusionClueId), deduction };
}

/* ───────────────────────── Tools in the player's hand ───────────────────────── */

/** How far the lamp throws, as a share of the image width. */
export const UV_BEAM = 20;
export const TORCH_BEAM = 14;
/** Brushing distance (in % of image width) needed to raise a print. A tap does nothing; it takes a few passes. */
export const BRUSH_NEEDED = 50;

type Pt = { x: number; y: number };
const dist = (a: Pt, b: Pt, aspect: number) => Math.hypot(a.x - b.x, (a.y - b.y) * aspect);

/** How brightly a UV stain shows (0–1) when the beam is centred on `at`. Nothing shows outside the beam. */
export function beamStrength(spot: Pt, at: Pt | null, beam = UV_BEAM, aspect = 0.75): number {
  if (!at) return 0;
  return Math.max(0, Math.min(1, (beam - dist(spot, at, aspect)) / (beam * 0.6)));
}

/** How much of a brush stroke from `a` to `b` lands on a spot: the stroke's length, if it ends on the spot. */
export function strokeOn(spot: Pt & { radius?: number }, a: Pt, b: Pt, aspect = 0.75): number {
  return dist(spot, b, aspect) <= Math.max(spot.radius ?? 0, 9) ? dist(a, b, aspect) : 0;
}
