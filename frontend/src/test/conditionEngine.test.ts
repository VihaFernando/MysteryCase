import { describe, expect, it } from "vitest";
import { collectRefs, describe as describeCondition, emptyPlayerState, evaluate, targetOptions } from "@/services/conditionEngine";
import { createDemoBundles } from "@/data/demo/cases";
import type { ConditionGroup, ConditionRule } from "@/types";

const rule = (kind: ConditionRule["kind"], targetId: string, negate = false): ConditionRule => ({ type: "rule", id: `${kind}-${targetId}`, kind, targetId, negate });
const group = (operator: "AND" | "OR", children: ConditionGroup["children"], negate = false): ConditionGroup => ({ type: "group", id: `g-${operator}`, operator, children, negate });

describe("evaluate", () => {
  const state = { ...emptyPlayerState(), evidence: ["ev-1"], clues: ["clu-1"], progress: 60 };

  it("treats a missing or empty condition as always true", () => {
    expect(evaluate(undefined, state)).toBe(true);
    expect(evaluate(group("AND", []), state)).toBe(true);
    expect(evaluate(group("OR", []), state)).toBe(true);
  });

  it("checks each rule kind against the player state", () => {
    expect(evaluate(rule("evidence_discovered", "ev-1"), state)).toBe(true);
    expect(evaluate(rule("evidence_discovered", "ev-2"), state)).toBe(false);
    expect(evaluate(rule("clue_discovered", "clu-1"), state)).toBe(true);
    expect(evaluate(rule("interview_completed", "int-1"), state)).toBe(false);
  });

  it("supports AND, OR and NOT", () => {
    const has1 = rule("evidence_discovered", "ev-1");
    const has2 = rule("evidence_discovered", "ev-2");
    expect(evaluate(group("AND", [has1, has2]), state)).toBe(false);
    expect(evaluate(group("OR", [has1, has2]), state)).toBe(true);
    expect(evaluate(rule("evidence_discovered", "ev-2", true), state)).toBe(true);
    expect(evaluate(group("AND", [has1], true), state)).toBe(false);
  });

  it("evaluates nested groups", () => {
    const nested = group("AND", [rule("clue_discovered", "clu-1"), group("OR", [rule("evidence_discovered", "ev-9"), rule("evidence_discovered", "ev-1")])]);
    expect(evaluate(nested, state)).toBe(true);
  });

  it("treats case_progress as a minimum percentage", () => {
    expect(evaluate(rule("case_progress", "50"), state)).toBe(true);
    expect(evaluate(rule("case_progress", "60"), state)).toBe(true);
    expect(evaluate(rule("case_progress", "75"), state)).toBe(false);
  });
});

describe("helpers", () => {
  const bundle = createDemoBundles().find((b) => b.evidence.length > 0)!;

  it("collects references from nested groups", () => {
    const c = group("AND", [rule("evidence_discovered", "a"), group("OR", [rule("clue_discovered", "b")])]);
    expect(collectRefs(c)).toEqual([{ kind: "evidence_discovered", id: "a" }, { kind: "clue_discovered", id: "b" }]);
    expect(collectRefs(undefined)).toEqual([]);
  });

  it("offers a target option for every entity of the chosen kind", () => {
    expect(targetOptions(bundle, "evidence_discovered")).toHaveLength(bundle.evidence.length);
    expect(targetOptions(bundle, "clue_discovered")).toHaveLength(bundle.clues.length);
    expect(targetOptions(bundle, "case_progress").length).toBeGreaterThan(0);
  });

  it("describes conditions in readable text", () => {
    expect(describeCondition(undefined, bundle)).toBe("Always");
    const ev = bundle.evidence[0]!;
    const text = describeCondition(group("AND", [rule("evidence_discovered", ev.id, true)]), bundle);
    expect(text).toContain("NOT");
    expect(text).toContain(ev.name);
  });
});
