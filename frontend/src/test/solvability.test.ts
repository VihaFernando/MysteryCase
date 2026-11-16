import { describe, expect, it } from "vitest";
import { createDemoBundles } from "@/data/demo/cases";
import { validateCase } from "@/services/validation";
import { playEverything } from "./playthrough";

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
