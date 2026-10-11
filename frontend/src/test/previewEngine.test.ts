import { describe, expect, it } from "vitest";
import { createDemoBundles } from "@/data/demo/cases";
import { applyTriggers, collectEvidence, initialPreviewState, walkDialogue } from "@/services/previewEngine";
import { scoreAccusation } from "@/services/scoring";
import { validateCase } from "@/services/validation";

const bundle = createDemoBundles().find((b) => b.interviews.length > 0)!;
const sarah = bundle.interviews.find((i) => i.id === "int-sarah")!;
const start = (i: typeof sarah) => i.nodes.find((n) => n.type === "start")!.id;

describe("walkDialogue", () => {
  it("stops at the question menu with the gated question locked", () => {
    const step = walkDialogue(bundle, sarah, start(sarah), initialPreviewState());
    expect(step.stop.type).toBe("choices");
    if (step.stop.type !== "choices") return;
    expect(step.stop.options).toHaveLength(6); // five topics + "That's all for now"
    expect(step.stop.options.find((o) => o.nodeId === "s-q4")?.locked).toBe(true);
    expect(step.stop.options.find((o) => o.nodeId === "s-q1")?.locked).toBe(false);
  });

  it("unlocks the evidence-gated question once the phone is found", () => {
    const s = collectEvidence(bundle, initialPreviewState(), "ev-001");
    const step = walkDialogue(bundle, sarah, start(sarah), s);
    if (step.stop.type !== "choices") throw new Error("expected choices");
    expect(step.stop.options.find((o) => o.nodeId === "s-q4")?.locked).toBe(false);
  });

  it("returns to the question menu after an answer, marking it asked", () => {
    const menu = walkDialogue(bundle, sarah, start(sarah), initialPreviewState());
    const answer = walkDialogue(bundle, sarah, "s-q1", menu.state, false, "s-menu");
    expect(answer.lines.map((l) => l.kind)).toEqual(["player", "npc"]);
    expect(answer.stop.type).toBe("choices");
    if (answer.stop.type !== "choices") return;
    expect(answer.stop.options.find((o) => o.nodeId === "s-q1")?.asked).toBe(true);
    expect(answer.state.interviewsCompleted).not.toContain("int-sarah");
  });

  it("completes the interview only when the player ends it", () => {
    const menu = walkDialogue(bundle, sarah, start(sarah), initialPreviewState());
    const end = walkDialogue(bundle, sarah, "s-end", menu.state, false, "s-menu");
    expect(end.stop.type).toBe("end");
    expect(end.state.interviewsCompleted).toContain("int-sarah");
  });

  it("awards the clue after presenting evidence and continues the conversation", () => {
    const s = collectEvidence(bundle, initialPreviewState(), "ev-001");
    const ask = walkDialogue(bundle, sarah, "s-q4", s, false, "s-menu");
    expect(ask.stop).toMatchObject({ type: "present", evidenceId: "ev-001" });
    expect(ask.stop).toMatchObject({ menuId: "s-menu" });
    const present = walkDialogue(bundle, sarah, "s-present", ask.state, true, "s-menu");
    expect(present.state.clues).toContain("clue-002");
    expect(present.stop.type).toBe("choices"); // react → q5 → a5 → unlock → back to the menu
    expect(present.state.unlocked).toContain("m-q4");
  });
});

describe("applyTriggers", () => {
  it("fires triggers whose conditions hold and never re-fires notifications", () => {
    const s = initialPreviewState();
    const first = applyTriggers(bundle, s);
    const second = applyTriggers(bundle, first.state);
    expect(second.notifications).toHaveLength(0);
    expect(second.state.firedTriggers).toEqual(first.state.firedTriggers);
  });
});

describe("scoring and validation on the demo case", () => {
  it("gives a full-credit accusation the maximum score", () => {
    const sol = bundle.solution;
    const r = scoreAccusation(bundle, { killerId: sol.killerId, motive: sol.motive, method: sol.method, evidenceIds: sol.requiredEvidenceIds, timelineOrder: sol.correctTimelineIds }, 0, 1);
    expect(r.correct).toBe(true);
    expect(r.total).toBe(sol.scoring.maxScore);
  });

  it("penalises accusing the wrong person", () => {
    const r = scoreAccusation(bundle, { killerId: "sus-sarah", motive: "", method: "", evidenceIds: [], timelineOrder: [] }, 0, 90);
    expect(r.correct).toBe(false);
    expect(r.total).toBe(0);
  });

  it("flags an empty case as invalid", () => {
    const blank = { ...bundle, scenes: [], evidence: [], timeline: [], reveal: [], solution: { ...bundle.solution, killerId: "" } };
    expect(validateCase(blank).some((r) => r.severity === "error")).toBe(true);
  });
});
