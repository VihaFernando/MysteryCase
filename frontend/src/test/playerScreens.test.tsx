import { describe, expect, it } from "vitest";
import { useRef, useState, type ReactNode } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { monsoonLedger as b } from "@/data/demo/monsoonLedger";
import { applyTriggers, collectClue, collectEvidence, initialPreviewState, type PreviewState } from "@/services/previewEngine";
import { EvidenceScreen, NotesScreen, PeopleScreen, SceneScreen, type Ctx } from "@/features/preview/PhoneScreens";

let latest: PreviewState;
function Harness({ start = initialPreviewState(), children }: { start?: PreviewState; children: (ctx: Ctx) => ReactNode }) {
  const [state, setState] = useState(start);
  const ref = useRef(state);
  latest = state;
  const commit: Ctx["commit"] = (fn) => { ref.current = applyTriggers(b, fn(ref.current)).state; setState(ref.current); };
  return <>{children({ bundle: b, state, getState: () => ref.current, commit, showHidden: false })}</>;
}
const click = (name: string | RegExp) => fireEvent.click(screen.getAllByRole("button", { name })[0]!);
const has = (k: string) => latest.clues.includes(`ml-${k}`) || latest.evidence.includes(`ml-${k}`);

describe("player screens", () => {
  it("searches a room: nothing is named until found, containers open, UV shows what the eye misses", () => {
    render(<Harness>{(ctx) => <SceneScreen ctx={ctx} sceneId="ml-scene-study" onSceneChange={() => {}} />}</Harness>);
    expect(screen.queryByText("Writing desk")).toBeNull();
    expect(screen.getByText("6 left")).toBeInTheDocument();
    click("Examine spot 1"); // the desk
    expect(screen.getByRole("heading", { name: "Writing desk" })).toBeInTheDocument();
    click("Something here…");
    expect(has("diary")).toBe(true);
    click("Close");
    expect(screen.queryAllByRole("button", { name: /Examine spot/ })).toHaveLength(2); // door and log; the carpet needs UV
    fireEvent.click(screen.getByRole("radio", { name: "UV lamp" }));
    click("Examine spot 2"); // found desk is slot 1 in any mode
    expect(has("uv-trail")).toBe(true);
  });

  it("keeps the cabinet shut until the right combination", () => {
    const start = collectClue(initialPreviewState(), "ml-letters");
    render(<Harness start={start}>{(ctx) => <SceneScreen ctx={ctx} sceneId="ml-scene-archive" onSceneChange={() => {}} />}</Harness>);
    click("Examine spot 1");
    fireEvent.change(screen.getByLabelText("Combination"), { target: { value: "1234" } });
    click("Try it");
    expect(screen.queryByText("Something here…")).toBeNull();
    fireEvent.change(screen.getByLabelText("Combination"), { target: { value: "1403" } });
    click("Try it");
    click("Something here…");
    expect(has("ledger")).toBe(true);
  });

  it("reads a document: the right line gives a note, filler costs a misstep", () => {
    render(<Harness start={collectEvidence(b, initialPreviewState(), "ml-diary")}>{(ctx) => <EvidenceScreen ctx={ctx} />}</Harness>);
    click(/Arun's appointment diary/);
    click("Thursday 12 November");
    expect(latest.mistakes).toBe(1);
    click(/20:50 — R\./);
    expect(has("audit-meeting")).toBe(true);
    expect(screen.getByText(/inside the death window/)).toBeInTheDocument();
  });

  it("interrogates: ask from the notebook, read the face, call truth, doubt or lie", () => {
    const start = ["letters", "plaque"].reduce((s, k) => collectClue(s, `ml-${k}`), initialPreviewState());
    render(<Harness start={start}>{(ctx) => <PeopleScreen ctx={ctx} />}</Harness>);
    click(/Malini Fernando/);
    click(/Malini Fernando/); // her interview
    click("Tell me about the tea you took up.");
    expect(screen.getByRole("img", { name: "Malini looks composed" })).toBeInTheDocument();
    expect(screen.getByText(/like reading out an order/)).toBeInTheDocument();
    click("Truth");
    expect(has("letters-on-desk")).toBe(true);
    click("Back to the notebook");
    click("Who did you pass on your way back?");
    expect(screen.getByRole("img", { name: "Malini looks uneasy" })).toBeInTheDocument();
    click("Truth"); // wrong: she is holding back
    expect(latest.mistakes).toBe(1);
    expect(screen.getByText(/Something in that answer does not hold/)).toBeInTheDocument();
    click("Doubt");
    expect(has("green-bundle")).toBe(true);
    click("Notebook"); click("Back"); click("People");
    click(/Anika Jayawardene/);
    click(/Anika Jayawardene/);
    click("What did you take from the study?");
    click("Lie");
    click("Mallika Jayawardene, 14 March 1966"); // proves nothing
    expect(latest.patience["ml-int-anika"]).toBe(2);
    click("Lie");
    click("Letters by his elbow at 20:45");
    expect(has("early-entry")).toBe(true);
    expect(screen.getByRole("img", { name: "Anika looks shaken" })).toBeInTheDocument();
    click(/That stays in my notebook/);
    expect(latest.choices).toContain("ml-anika-shielded");
    expect(screen.getByRole("img", { name: "Anika looks at ease" })).toBeInTheDocument();
  });

  it("links notes on the board into a deduction", () => {
    const start = ["ring", "missing-weight", "clean-tea"].reduce((s, k) => collectClue(s, `ml-${k}`), initialPreviewState());
    render(<Harness start={start}>{(ctx) => <NotesScreen ctx={ctx} />}</Harness>);
    expect(screen.getByText("What killed Arun, and where did it come from?")).toBeInTheDocument();
    click(/A clean circle on the blotter/);
    click(/The tea was harmless/);
    click("Link 2 notes");
    expect(latest.mistakes).toBe(1);
    click(/A clean circle on the blotter/);
    click(/The weight was there at 20:45/);
    click("Link 2 notes");
    expect(has("weapon-from-desk")).toBe(true);
  });
});
