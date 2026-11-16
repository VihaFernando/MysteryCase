import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { monsoonLedger as b } from "@/data/demo/monsoonLedger";
import { validateCase, completeness } from "@/services/validation";
import {
  applyTriggers, challengeStatement, chooseApproach, collectEvidence, composure, flagLine, hasLock, BRUSH_NEEDED, beamStrength, strokeOn, hotspotAt, hotspotStatus, judgeStatement, initialPreviewState, isInterviewOpen, isLocationOpen, isSceneOpen,
  patienceOf, refusesChallenges, searchable, tryDeduction, tryLock, collectClue, type PreviewState,
} from "@/services/previewEngine";
import { scoreAccusation } from "@/services/scoring";
import { playEverything, type Policy } from "./playthrough";

const ml = (k: string) => `ml-${k}`;
const has = (s: PreviewState, k: string) => s.clues.includes(ml(k)) || s.evidence.includes(ml(k));
// The player can open the cabinet once told the code, or once they have both the diary's hint and the plaque's date.
const knowsCode: Policy["knowsCode"] = (_h, s) => has(s, "cabinet-code") || (has(s, "cabinet-hint") && has(s, "plaque"));
const careful = ["anika-trust", "anika-shielded", "dev-nodeal", "rohan-held", "rohan-compassion"].map(ml);
const rohan = b.suspects.find((x) => x.isKiller)!;
const scene = (k: string) => b.scenes.find((x) => x.id === ml(`scene-${k}`))!;
const talk = (k: string) => b.interviews.find((x) => x.id === ml(`int-${k}`))!;
const statement = (iv: string, k: string) => talk(iv).testimony!.find((x) => x.id === ml(`st-${iv}-${k}`))!;

/** Accuses Rohan with everything the player holds and returns the result. */
function accuse(s: PreviewState, killer = rohan) {
  const won = (killer.objections ?? []).filter((o) => o.beatenBy.some((x) => s.evidence.includes(x) || s.clues.includes(x))).length;
  return scoreAccusation(b, { killerId: killer.id, motive: b.solution.motive, method: b.solution.method, evidenceIds: [], timelineOrder: b.solution.correctTimelineIds, rebuttals: { won, total: killer.objections!.length }, mistakes: s.mistakes }, 0, 40, s);
}

/** State at the moment Rohan's email alibi has just been broken, before the laundry has been searched. */
function atTheFork() {
  let s = collectEvidence(b, initialPreviewState(), ml("dispatch"));
  const r = challengeStatement(talk("rohan"), s, statement("rohan", "desk"), ml("dispatch"));
  expect(r.ok).toBe(true);
  s = r.state;
  return (choice: string) => applyTriggers(b, chooseApproach(s, statement("rohan", "desk"), ml(choice))).state;
}

describe("The Monsoon Ledger", () => {
  const end = playEverything(b, { choices: careful, knowsCode });

  it("is complete and passes editorial validation", () => {
    expect(completeness(b).percent).toBe(100);
    expect(validateCase(b).filter((r) => !["media", "translations"].includes(r.id) && r.severity !== "pass")).toEqual([]);
  });

  it("only references things that exist", () => {
    const known = new Set([...b.evidence, ...b.clues].map((x) => x.id));
    const refs = [
      ...b.interviews.flatMap((i) => i.testimony!.flatMap((st) => [...(st.contradictedBy ?? []), ...[st.press, st.exposed, ...(st.choices ?? [])].flatMap((r) => r?.clueIds ?? [])])),
      ...b.suspects.flatMap((x) => x.objections!.flatMap((o) => o.beatenBy)),
      ...b.deductions!.flatMap((d) => [...d.clueIds, d.conclusionClueId]),
      ...b.evidence.flatMap((e) => [...e.relatedClueIds, ...(e.compare ?? []).map((c) => c.withEvidenceId)]),
      ...b.scenes.flatMap((sc) => sc.hotspots.flatMap((h) => [h.evidenceId, h.clueId].filter((x): x is string => !!x))),
    ];
    expect(refs.filter((r) => !known.has(r))).toEqual([]);
    for (const sc of b.scenes) for (const h of sc.hotspots) if (h.parentId) expect(sc.hotspots.some((p) => p.id === h.parentId)).toBe(true);
  });

  it("has several rooms in every location", () => {
    for (const l of b.locations) expect(b.scenes.filter((sc) => sc.locationId === l.id).length).toBeGreaterThanOrEqual(2);
  });

  it("hides things until the right tool, the right container or the right code", () => {
    const study = scene("study");
    const carpet = study.hotspots.find((h) => h.id === ml("spot-carpet"))!;
    const spots = searchable(study, initialPreviewState());
    expect(hotspotAt(spots, undefined, carpet.x, carpet.y)).toBeUndefined(); // invisible to the naked eye
    expect(hotspotAt(spots, "uv", carpet.x, carpet.y)?.id).toBe(carpet.id);
    expect(hotspotAt(spots, undefined, 5, 5)).toBeUndefined(); // empty wall
    expect(spots.some((h) => h.id === ml("spot-diary"))).toBe(false); // inside the desk
    const cabinet = scene("archive").hotspots.find((h) => h.lock)!;
    expect(hasLock(cabinet, initialPreviewState())).toBe(true);
    expect(tryLock(cabinet, "0000")).toBe(false);
    expect(tryLock(cabinet, "14-03")).toBe(true);
  });

  it("a careful investigator can reach everything on their branch and gets the best ending", () => {
    expect(b.evidence.map((e) => e.id).filter((x) => !end.evidence.includes(x))).toEqual([ml("ash")]); // the ash only exists on the branch where the page burns
    expect(b.locations.filter((l) => !isLocationOpen(b, l.id, end))).toEqual([]);
    expect(b.scenes.filter((sc) => !isSceneOpen(b, sc, end))).toEqual([]);
    expect(b.interviews.filter((i) => !isInterviewOpen(i, end))).toEqual([]);
    for (const iv of b.interviews.filter((i) => i.id !== ml("int-dev"))) expect(composure(iv, end).left).toBe(0);
    expect(end.mistakes).toBe(0);
    for (const k of ["confession", "reserve-account", "page-print", "weight-print", "motive-proved", "false-alibi", "one-left", "early-entry"]) expect(has(end, k)).toBe(true);
    for (const k of ["burnt", "basket-return", "recording", "ash-fragment"]) expect(has(end, k)).toBe(false);
    const result = accuse(end);
    expect(result.total).toBe(1000);
    expect(result.ending!.title).toBe("The missing page restored");
    expect(result.ending!.text).toContain("ribbon-tied bundle"); // shielded Anika
  });

  it("locks the accounts wing and the laundry until a lead points there, by more than one route", () => {
    const fresh = initialPreviewState();
    expect(isLocationOpen(b, ml("accounts"), fresh)).toBe(false);
    expect(isSceneOpen(b, scene("laundry"), fresh)).toBe(false);
    for (const k of ["audit-meeting", "letters"]) expect(isLocationOpen(b, ml("accounts"), collectClue(fresh, ml(k)))).toBe(true);
    for (const k of ["service-stairs", "green-bundle", "recording"]) expect(isSceneOpen(b, scene("laundry"), collectClue(fresh, ml(k)))).toBe(true);
  });

  it("punishes guessing in an interrogation and forgives it once the player learns something new", () => {
    const iv = talk("anika");
    let s = collectClue(collectEvidence(b, initialPreviewState(), ml("tea")), ml("letters"));
    for (let i = 0; i < 3; i++) {
      expect(refusesChallenges(iv, s)).toBe(false);
      const r = challengeStatement(iv, s, statement("anika", "letters"), ml("tea"));
      expect(r.ok).toBe(false);
      s = r.state;
    }
    expect(patienceOf(iv, s)).toBe(0);
    expect(refusesChallenges(iv, s)).toBe(true);
    expect(s.mistakes).toBe(3);
    expect(challengeStatement(iv, s, statement("anika", "letters"), ml("letters-on-desk")).ok).toBe(false); // even the right answer, while she refuses
    s = collectClue(s, ml("letters-on-desk"));
    expect(refusesChallenges(iv, s)).toBe(false);
    const r = challengeStatement(iv, s, statement("anika", "letters"), ml("letters-on-desk"));
    expect(r.ok).toBe(true);
    expect(has(r.state, "early-entry")).toBe(true);
    expect(patienceOf(iv, r.state)).toBe(3);
  });

  it("scores the player's read of each answer: truth, doubt, or lie with proof", () => {
    const iv = talk("malini");
    const fresh = initialPreviewState();
    const tea = statement("malini", "tea"), corridor = statement("malini", "corridor");
    expect(judgeStatement(iv, fresh, tea, "truth")).toMatchObject({ ok: true, state: { mistakes: 0 } });
    expect(judgeStatement(iv, fresh, tea, "truth").state.clues).toContain(ml("missing-weight"));
    expect(judgeStatement(iv, fresh, tea, "doubt")).toMatchObject({ ok: false, state: { mistakes: 1 } });
    expect(judgeStatement(iv, fresh, corridor, "truth")).toMatchObject({ ok: false, state: { mistakes: 1 } }); // believed someone holding back
    expect(judgeStatement(iv, fresh, corridor, "lie", ml("tea")).ok).toBe(false); // nothing proves it; it takes pressure
    expect(judgeStatement(iv, fresh, corridor, "doubt").state.clues).toContain(ml("green-bundle"));
    const desk = statement("rohan", "desk");
    expect(judgeStatement(talk("rohan"), fresh, desk, "doubt").ok).toBe(false); // a lie needs proof, not a hunch
    expect(judgeStatement(talk("rohan"), fresh, desk, "lie", ml("dispatch")).ok).toBe(true);
    for (const i of b.interviews) for (const st of i.testimony!) expect(st.ask && st.tell?.text).toBeTruthy();
  });

  it("gives every interrogation a graph the editor can show, that matches the game", () => {
    for (const iv of b.interviews) {
      expect(iv.nodes.length).toBeGreaterThan(10);
      expect(iv.nodes.filter((n) => n.type === "start")).toHaveLength(1);
      expect(iv.nodes.filter((n) => n.type === "end")).toHaveLength(1);
      const ids = new Set(iv.nodes.map((n) => n.id));
      for (const st of iv.testimony!) {
        expect(ids.has(st.id)).toBe(true); // the question node is the statement
        expect(iv.nodes.find((n) => n.id === st.id)!.condition).toEqual(st.condition);
        for (const c of st.choices ?? []) expect(iv.edges.some((e) => e.id === c.id)).toBe(true); // choice edges carry the choice id
      }
      for (const e of iv.edges) { expect(ids.has(e.source)).toBe(true); expect(ids.has(e.target)).toBe(true); }
    }
    const rohan = talk("rohan");
    const present = rohan.nodes.find((n) => n.type === "present_evidence" && n.evidenceId === ml("dispatch"));
    expect(present?.text).toContain("Mail server audit"); // the lie is proved with the audit
    expect(rohan.nodes.some((n) => n.type === "clue" && n.clueId === ml("torch-story"))).toBe(true);
  });

  it("makes UV a beam and powder a brush: stains show only inside the beam and a tap never raises a print", () => {
    const stain = { x: 50, y: 50 };
    expect(beamStrength(stain, null)).toBe(0);
    expect(beamStrength(stain, { x: 90, y: 50 })).toBe(0); // beam elsewhere
    expect(beamStrength(stain, { x: 50, y: 50 })).toBe(1);
    expect(beamStrength(stain, { x: 60, y: 50 })).toBeGreaterThan(0); // the edge of the beam
    expect(beamStrength(stain, { x: 60, y: 50 })).toBeLessThan(1);
    const spot = { x: 50, y: 50, radius: 10 };
    expect(strokeOn(spot, { x: 50, y: 50 }, { x: 50, y: 50 })).toBe(0); // a tap
    expect(strokeOn(spot, { x: 10, y: 10 }, { x: 90, y: 90 })).toBe(0); // a stroke ending elsewhere
    let rubbed = 0;
    for (let pass = 0; pass < 6; pass++) rubbed += strokeOn(spot, { x: pass % 2 ? 60 : 40, y: 50 }, { x: pass % 2 ? 40 : 60, y: 50 });
    expect(rubbed).toBeGreaterThanOrEqual(BRUSH_NEEDED); // a few passes back and forth
    expect(strokeOn(spot, { x: 40, y: 50 }, { x: 60, y: 50 })).toBeLessThan(BRUSH_NEEDED); // but not one
  });

  it("costs a misstep for flagging filler or linking unrelated notes", () => {
    const diary = b.evidence.find((e) => e.id === ml("diary"))!;
    expect(flagLine(initialPreviewState(), diary, 0)).toMatchObject({ ok: false, state: { mistakes: 1 } });
    expect(flagLine(initialPreviewState(), diary, 2).state.clues).toContain(ml("audit-meeting"));
    const s = ["ring", "clean-tea", "missing-weight"].reduce((x, k) => collectClue(x, ml(k)), initialPreviewState());
    expect(tryDeduction(b, s, [ml("ring"), ml("clean-tea")])).toMatchObject({ state: { mistakes: 1 } });
    expect(tryDeduction(b, s, [ml("missing-weight"), ml("ring")]).state.clues).toContain(ml("weapon-from-desk"));
  });

  it("burns page 47 if Rohan is let out before the laundry is searched", () => {
    const released = atTheFork()("rohan-released");
    expect(has(released, "burnt")).toBe(true);
    expect(hotspotStatus(scene("laundry").hotspots.find((h) => h.evidenceId === ml("page"))!, released)).toBe("hidden");
    expect(hotspotStatus(scene("kitchen").hotspots.find((h) => h.evidenceId === ml("ash"))!, released)).toBe("open");
    expect(has(atTheFork()("rohan-held"), "burnt")).toBe(false);

    // The case can still be made on the weight, and what Rohan is asked at the end decides whether the money comes back.
    const cold = playEverything(b, { choices: [ml("rohan-challenge")], knowsCode }, released);
    expect(has(cold, "page")).toBe(false);
    expect(has(cold, "burnt-proof")).toBe(true);
    expect(accuse(cold)).toMatchObject({ correct: true, ending: { title: "Ashes in the stove" } });
    const kind = playEverything(b, { choices: [ml("rohan-compassion")], knowsCode }, released);
    expect(accuse(kind).ending!.title).toBe("A confession buys back a pension");
  });

  it("turns the same decision into proof if the laundry was searched first", () => {
    const s = playEverything(b, { choices: [ml("rohan-released")], knowsCode });
    expect(has(s, "page")).toBe(true);
    expect(has(s, "basket-return")).toBe(true);
    expect(has(s, "burnt")).toBe(false);
    expect(accuse(s).ending!.text).toContain("one basket in a corridor of twelve");
  });

  it("trades the recording for the pensions if the player deals with Dev", () => {
    expect(has(end, "recorder")).toBe(true);
    const s = playEverything(b, { choices: [ml("dev-deal")], knowsCode });
    expect(has(s, "recording")).toBe(true);
    expect(accuse(s)).toMatchObject({ correct: true, ending: { title: "Front page" } });
  });

  it("keeps the final interrogation shut until alibi, weapon and money trail are all in hand", () => {
    const iv = talk("confrontation");
    expect(isInterviewOpen(iv, initialPreviewState())).toBe(false);
    for (const k of ["false-alibi", "weight-match", "pension-trail"]) expect(isInterviewOpen(iv, { ...end, unlocked: [], clues: end.clues.filter((c) => c !== ml(k)) })).toBe(false);
  });

  it("lets every innocent suspect defeat the accusation, and a thin case against Rohan fall short", () => {
    for (const x of b.suspects.filter((p) => !p.isKiller)) {
      const r = accuse(end, x);
      expect(r.correct).toBe(false);
      expect(r.ending!.title).toBe("The wrong door");
    }
    const thin = accuse({ ...initialPreviewState(), clues: [ml("scheduled-email")] });
    expect(thin.correct).toBe(true);
    expect(thin.ending!.title).toBe("A name is not the whole case");
    expect(thin.total).toBeLessThan(1000);
  });

  it("ships the same story in the backend seed, with local images", () => {
    const seed = JSON.parse(readFileSync("../backend/seed.json", "utf8"));
    const installed = seed.case.find((x: typeof b) => x.case.id === b.case.id);
    expect(installed.interviews).toEqual(JSON.parse(JSON.stringify(b.interviews)));
    expect(installed.scenes.map((x: { hotspots: unknown }) => x.hotspots)).toEqual(JSON.parse(JSON.stringify(b.scenes.map((x) => x.hotspots))));
    expect(installed.storyEndings).toEqual(JSON.parse(JSON.stringify(b.storyEndings)));
    const images = [b.case.coverImage, ...b.scenes.map((s) => s.image), ...b.suspects.map((s) => s.portrait!), ...b.evidence.map((e) => e.image!), ...b.reveal.map((r) => r.image!)];
    for (const url of images) expect(existsSync(`src/assets/${url.split("/").pop()}`)).toBe(true);
  });
});
