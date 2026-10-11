import { evaluate, type PlayerState } from "./conditionEngine";
import type { CaseBundle, DialogueNode, Evidence, Hotspot, Interview, InspectionRequirement, Reaction } from "@/types";

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
}

export const initialPreviewState = (): PreviewState => ({
  evidence: [], clues: [], interviewsCompleted: [], questionsAnswered: [], locationsVisited: [], suspectsInterviewed: [], timelineDiscovered: [], choices: [], progress: 0,
  unlocked: [], stagesDone: [], actionsDone: [], firedTriggers: [], hintsUsed: [], startedAt: Date.now(),
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
