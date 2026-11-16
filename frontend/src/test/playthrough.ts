import {
  applyTriggers, challengeStatement, choiceOpen, judgeStatement, statementKind, chooseApproach, compareEvidence, completeStage, evidenceLocked, findDetail, flagLine, hasLock, hearTestimony, hotspotStatus, initialPreviewState,
  isInterviewOpen, isSceneOpen, pressStatement, searchable, searchHotspot, statementsOf, tryDeduction, unmetRequirements, walkDialogue, type PreviewState,
} from "@/services/previewEngine";
import type { CaseBundle, Hotspot, Interview } from "@/types";

/** How the simulated player behaves where the game leaves it to them. */
export interface Policy {
  /** Choice IDs to take when a one-time decision comes up; anything not listed is left undecided. */
  choices?: string[];
  /** Whether the player can work out a combination from what they know. */
  knowsCode?: (h: Hotspot, s: PreviewState) => boolean;
}

/** Asks every question and reads every answer correctly: believes the truthful, doubts the evasive, exposes every lie the case file can expose (never guessing), and takes the policy's decisions. */
function interrogate(iv: Interview, input: PreviewState, policy: Policy): PreviewState {
  let s = hearTestimony(iv, input);
  for (let pass = 0; pass < 6; pass++) {
    for (const st of statementsOf(iv, s)) {
      if (statementKind(st) === "truth") s = pressStatement(s, st);
      if (statementKind(st) === "doubt" && !s.exposed.includes(st.id)) s = judgeStatement(iv, s, st, "doubt").state;
      const proof = st.contradictedBy?.find((x) => s.evidence.includes(x) || s.clues.includes(x));
      if (proof && !s.exposed.includes(st.id)) s = challengeStatement(iv, s, st, proof).state;
      const pick = st.choices?.find((c) => policy.choices?.includes(c.id));
      if (pick && choiceOpen(st, s)) s = chooseApproach(s, st, pick.id);
    }
  }
  return s;
}

/** Plays every interview to the end, taking every unlocked option, using only the evidence the player already holds. */
function playInterview(b: CaseBundle, iv: Interview, input: PreviewState): PreviewState {
  let s = input;
  const go = (nodeId: string, resume: boolean, depth: number, menu?: string) => {
    if (depth > 80) return;
    const step = walkDialogue(b, iv, nodeId, s, resume, menu);
    s = step.state;
    if (step.stop.type === "choices") {
      for (const o of step.stop.options) if (!o.locked && !o.asked) go(o.nodeId, false, depth + 1, step.stop.menuId); // topics loop back to the menu, so skip ones already asked
    } else if (step.stop.type === "present" && (!step.stop.evidenceId || s.evidence.includes(step.stop.evidenceId))) {
      go(step.stop.nodeId, true, depth + 1, step.stop.menuId);
    }
  };
  const start = iv.nodes.find((n) => n.type === "start");
  // questions unlock as earlier ones are asked, so keep replaying until nothing new turns up
  for (let pass = 0; pass < 5 && start; pass++) go(start.id, false, 0);
  return s;
}

/** A thorough player: visits every reachable scene, taps everything, inspects every stage, finishes every interview — until nothing new happens. */
export function playEverything(b: CaseBundle, policy: Policy = {}, from: PreviewState = initialPreviewState()): PreviewState {
  let s = applyTriggers(b, from).state;
  const snapshot = (x: PreviewState) => JSON.stringify([x.evidence, x.clues, x.locationsVisited, x.stagesDone, x.interviewsCompleted, x.questionsAnswered, x.unlocked, x.timelineDiscovered, x.found, x.examined, x.exposed, x.choices, x.deductions]);

  for (let round = 0; round < 40; round++) {
    const before = snapshot(s);

    for (const scene of b.scenes) {
      if (!isSceneOpen(b, scene, s)) continue;
      s = { ...s, locationsVisited: s.locationsVisited.includes(scene.locationId) ? s.locationsVisited : [...s.locationsVisited, scene.locationId] };
      for (let depth = 0; depth < 4; depth++) { // containers reveal what is inside them
        for (const h of searchable(scene, s)) {
          if (hotspotStatus(h, s) !== "open") continue;
          if (hasLock(h, s)) { if (!policy.knowsCode?.(h, s)) continue; s = { ...s, opened: [...s.opened, h.id] }; }
          s = searchHotspot(b, s, h);
        }
      }
      s = applyTriggers(b, s).state;
    }

    for (const ev of b.evidence.filter((e) => s.evidence.includes(e.id) && !evidenceLocked(e, s))) {
      for (const d of ev.details ?? []) s = findDetail(s, ev, d.id);
      for (const k of ev.document?.key ?? []) s = flagLine(s, ev, k.line).state;
      for (const c of ev.compare ?? []) if (s.evidence.includes(c.withEvidenceId)) s = compareEvidence(b, s, ev.id, c.withEvidenceId).state;
      ev.inspections.forEach((stage, i) => {
        if (s.stagesDone.includes(stage.id)) return;
        // the player can always perform a "player action" requirement themselves
        for (const { req, index } of unmetRequirements(ev, i, s)) if (req.kind === "player_action") s = { ...s, actionsDone: [...s.actionsDone, `${stage.id}:${index}`] };
        if (unmetRequirements(ev, i, s).length === 0) s = completeStage(s, ev, i);
      });
      s = applyTriggers(b, s).state;
    }

    for (const iv of b.interviews) {
      if (!isInterviewOpen(iv, s)) continue;
      s = applyTriggers(b, iv.testimony?.length ? interrogate(iv, s, policy) : playInterview(b, iv, s)).state;
    }

    for (const d of b.deductions ?? []) if (!s.deductions.includes(d.id) && d.clueIds.every((c) => s.clues.includes(c))) s = applyTriggers(b, tryDeduction(b, s, d.clueIds).state).state;

    if (snapshot(s) === before) break;
  }
  return s;
}

