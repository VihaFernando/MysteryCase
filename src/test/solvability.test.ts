import { describe, expect, it } from "vitest";
import { createDemoBundles } from "@/data/demo/cases";
import {
  applyTriggers, collectFromHotspot, completeStage, hotspotStatus, initialPreviewState, isInterviewOpen, isLocationOpen, unmetRequirements, walkDialogue,
  type PreviewState,
} from "@/services/previewEngine";
import { validateCase } from "@/services/validation";
import type { CaseBundle, Interview } from "@/types";

/** Plays every interview to the end, taking every unlocked option, using only the evidence the player already holds. */
function playInterview(b: CaseBundle, iv: Interview, input: PreviewState): PreviewState {
  let s = input;
  const go = (nodeId: string, resume: boolean, depth: number) => {
    if (depth > 80) return;
    const step = walkDialogue(b, iv, nodeId, s, resume);
    s = step.state;
    if (step.stop.type === "choices") {
      for (const o of step.stop.options) if (!o.locked) go(o.nodeId, false, depth + 1);
    } else if (step.stop.type === "present" && (!step.stop.evidenceId || s.evidence.includes(step.stop.evidenceId))) {
      go(step.stop.nodeId, true, depth + 1);
    }
  };
  const start = iv.nodes.find((n) => n.type === "start");
  if (start) go(start.id, false, 0);
  return s;
}

/** A thorough player: visits every reachable scene, taps everything, inspects every stage, finishes every interview — until nothing new happens. */
function playEverything(b: CaseBundle): PreviewState {
  let s = applyTriggers(b, initialPreviewState()).state;
  const snapshot = (x: PreviewState) => JSON.stringify([x.evidence, x.clues, x.locationsVisited, x.stagesDone, x.interviewsCompleted, x.questionsAnswered, x.unlocked, x.timelineDiscovered]);

  for (let round = 0; round < 40; round++) {
    const before = snapshot(s);

    for (const scene of b.scenes) {
      if (!isLocationOpen(b, scene.locationId, s)) continue;
      s = { ...s, locationsVisited: s.locationsVisited.includes(scene.locationId) ? s.locationsVisited : [...s.locationsVisited, scene.locationId] };
      for (const h of scene.hotspots) if (hotspotStatus(h, s) === "open") s = collectFromHotspot(b, s, h);
      s = applyTriggers(b, s).state;
    }

    for (const ev of b.evidence.filter((e) => s.evidence.includes(e.id))) {
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
      s = applyTriggers(b, playInterview(b, iv, s)).state;
    }

    if (snapshot(s) === before) break;
  }
  return s;
}

describe("demo case solvability", () => {
  const bundle = createDemoBundles().find((x) => x.case.id === "case-001")!;
  const end = playEverything(bundle);
  const missing = (all: string[], have: string[]) => all.filter((id) => !have.includes(id));

  it("lets the player find every piece of required evidence", () => {
    expect(missing(bundle.solution.requiredEvidenceIds, end.evidence)).toEqual([]);
  });

  it("lets the player find all evidence", () => {
    expect(missing(bundle.evidence.map((e) => e.id), end.evidence)).toEqual([]);
  });

  it("lets the player visit every scene's location, including those opened by evidence, clues and interviews", () => {
    expect(missing(bundle.scenes.map((s) => s.locationId), end.locationsVisited)).toEqual([]);
  });

  it("has a scene for every location the player is asked to visit", () => {
    const needed = new Set<string>();
    for (const e of bundle.evidence) for (const st of e.inspections) for (const r of st.requirements) if (r.kind === "location" && r.targetId) needed.add(r.targetId);
    for (const l of bundle.locations) if (!l.unlockedByDefault) needed.add(l.id);
    const withScene = new Set(bundle.scenes.map((s) => s.locationId));
    expect([...needed].filter((id) => !withScene.has(id))).toEqual([]);
  });

  it("lets the player complete every interview", () => {
    expect(missing(bundle.interviews.map((i) => i.id), end.interviewsCompleted)).toEqual([]);
  });

  it("lets the player finish every inspection stage", () => {
    expect(missing(bundle.evidence.flatMap((e) => e.inspections.map((s) => s.id)), end.stagesDone)).toEqual([]);
  });

  it("lets the player discover every clue", () => {
    expect(missing(bundle.clues.map((c) => c.id), end.clues)).toEqual([]);
  });

  it("lets the player learn every timeline event the solution needs", () => {
    const known = (id: string) => bundle.timeline.find((t) => t.id === id)?.visibility === "visible" || end.timelineDiscovered.includes(id);
    expect(bundle.solution.correctTimelineIds.filter((id) => !known(id))).toEqual([]);
  });

  it("passes the reachability checks in the editor's validation", () => {
    const issues = validateCase(bundle).filter((r) => r.id.startsWith("unreachable-") && r.severity !== "pass");
    expect(issues).toEqual([]);
  });

  it("makes the editor flag a required evidence item with no hotspot and a location with no scene", () => {
    const broken = {
      ...bundle,
      scenes: bundle.scenes.filter((sc) => sc.locationId !== "loc-bedroom"),
    };
    const byId = Object.fromEntries(validateCase(broken).map((r) => [r.id, r]));
    expect(byId["unreachable-evidence"]?.severity).toBe("error");
    expect(byId["unreachable-locations"]?.severity).toBe("error");
  });
});
