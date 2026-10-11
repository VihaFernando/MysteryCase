import type { CaseBundle } from "@/types";
import { collectRefs, targetOptions } from "./conditionEngine";

export type Severity = "pass" | "warning" | "error";

export interface ValidationResult {
  id: string;
  category: string;
  label: string;
  severity: Severity;
  messages: string[];
  link?: string | undefined;
}

const result = (id: string, category: string, label: string, errors: string[], warnings: string[] = [], link?: string): ValidationResult => ({
  id, category, label, link,
  severity: errors.length ? "error" : warnings.length ? "warning" : "pass",
  messages: [...errors, ...warnings],
});

/** Reachable node IDs from the start node in a directed graph. */
function reachable(start: string | undefined, edges: Array<{ source: string; target: string }>): Set<string> {
  const seen = new Set<string>();
  if (!start) return seen;
  const stack = [start];
  while (stack.length) {
    const cur = stack.pop()!;
    if (seen.has(cur)) continue;
    seen.add(cur);
    for (const e of edges) if (e.source === cur) stack.push(e.target);
  }
  return seen;
}

/** Pure, backend-portable case validation. Same rules can run server-side before publish. */
export function validateCase(b: CaseBundle): ValidationResult[] {
  const ev = new Set(b.evidence.map((e) => e.id));
  const clues = new Set(b.clues.map((c) => c.id));
  const out: ValidationResult[] = [];

  out.push(result("story", "Story", "Story & basic info",
    [!b.case.title && "Case title is missing", !b.case.story && "Story setup is empty", !b.case.victim.name && "Victim is not defined"].filter(Boolean) as string[],
    [b.case.tags.length === 0 && "No tags set"].filter(Boolean) as string[], "basic-info"));

  out.push(result("images", "Media", "Missing images",
    [!b.case.coverImage && "Case cover image missing", ...b.scenes.filter((s) => !s.image).map((s) => `Scene "${s.name}" has no image`)].filter((x): x is string => typeof x === "string"),
    [...b.evidence.filter((e) => !e.image).map((e) => `${e.code} has no image`), ...b.suspects.filter((s) => !s.portrait).map((s) => `${s.name} has no portrait`)], "scenes"));

  out.push(result("scenes", "Scenes", "Crime scenes",
    b.scenes.length === 0 ? ["At least one crime scene is required"] : [],
    b.scenes.filter((s) => s.hotspots.length === 0).map((s) => `Scene "${s.name}" has no hotspots`), "scenes"));

  const brokenHotspots = b.scenes.flatMap((s) => s.hotspots.filter((h) => h.evidenceId && !ev.has(h.evidenceId)).map((h) => `Hotspot "${h.name}" links to missing evidence`));
  out.push(result("evidence", "Evidence", "Missing evidence",
    [...(b.evidence.length === 0 ? ["No evidence defined"] : []), ...brokenHotspots],
    b.evidence.filter((e) => e.inspections.length === 0).map((e) => `${e.code} has no inspection stages`), "evidence"));

  // Evidence only enters the player's hands through a hotspot, so anything not on one can never be found.
  const onHotspot = new Set(b.scenes.flatMap((sc) => sc.hotspots.map((h) => h.evidenceId).filter(Boolean)));
  const required = new Set(b.solution.requiredEvidenceIds);
  const unplaced = b.evidence.filter((e) => !onHotspot.has(e.id));
  out.push(result("unreachable-evidence", "Evidence", "Evidence players can never find",
    unplaced.filter((e) => required.has(e.id)).map((e) => `${e.code} "${e.name}" is required to solve the case but is not on any hotspot`),
    unplaced.filter((e) => !required.has(e.id)).map((e) => `${e.code} "${e.name}" is not on any hotspot`), "scenes"));

  // A location only counts as visited when the player opens one of its scenes.
  const sceneLocations = new Set(b.scenes.map((sc) => sc.locationId));
  const asked = new Set<string>();
  b.evidence.forEach((e) => e.inspections.forEach((st) => st.requirements.forEach((r) => { if (r.kind === "location" && r.targetId) asked.add(r.targetId); })));
  const locName = (id: string) => b.locations.find((l) => l.id === id)?.name ?? id;
  out.push(result("unreachable-locations", "Scenes", "Locations without a scene",
    [...asked].filter((id) => !sceneLocations.has(id)).map((id) => `"${locName(id)}" must be visited for an inspection stage, but has no scene`),
    b.locations.filter((l) => !l.unlockedByDefault && !asked.has(l.id) && !sceneLocations.has(l.id)).map((l) => `"${l.name}" is locked and has no scene, so it can never be opened`), "scenes"));

  const dialogueErrors: string[] = [];
  const deadEnds: string[] = [];
  const unreachable: string[] = [];
  for (const i of b.interviews) {
    const ids = new Set(i.nodes.map((n) => n.id));
    i.edges.forEach((e) => { if (!ids.has(e.source) || !ids.has(e.target)) dialogueErrors.push(`${i.code}: connection ${e.id} points to a missing node`); });
    const start = i.nodes.find((n) => n.type === "start");
    if (!start) dialogueErrors.push(`${i.code}: no START node`);
    const r = reachable(start?.id, i.edges);
    i.nodes.forEach((n) => {
      if (!r.has(n.id)) unreachable.push(`${i.code}: "${n.text.slice(0, 40)}" is unreachable`);
      if (n.type !== "end" && !i.edges.some((e) => e.source === n.id)) deadEnds.push(`${i.code}: "${n.text.slice(0, 40)}" has no outgoing path`);
    });
    if (!i.nodes.some((n) => n.type === "end")) dialogueErrors.push(`${i.code}: no END node`);
  }
  out.push(result("dialogue", "Interviews", "Broken dialogue connections", dialogueErrors, [], "interviews"));
  out.push(result("unreachable", "Interviews", "Unreachable nodes", [], unreachable, "interviews"));
  out.push(result("deadends", "Interviews", "Dead-end interview paths", deadEnds, [], "interviews"));

  const s = b.solution;
  out.push(result("solution", "Solution", "Missing solution",
    [!s.killerId && "Correct killer not set", !s.motive && "Motive not set", !s.method && "Method not set"].filter(Boolean) as string[], [], "solution"));
  out.push(result("required", "Solution", "Missing required evidence",
    [...(s.requiredEvidenceIds.length === 0 ? ["No required evidence selected"] : []), ...s.requiredEvidenceIds.filter((id) => !ev.has(id)).map((id) => `Required evidence ${id} no longer exists`)], [], "solution"));

  const invalid: string[] = [];
  for (const t of b.triggers) {
    for (const ref of collectRefs(t.condition)) {
      if (ref.kind === "case_progress") continue;
      if (!targetOptions(b, ref.kind).some((o) => o.value === ref.id)) invalid.push(`Trigger "${t.name}" references unknown ${ref.kind.replace(/_/g, " ")} (${ref.id || "empty"})`);
    }
    if (t.actions.length === 0) invalid.push(`Trigger "${t.name}" has no actions`);
  }
  out.push(result("triggers", "Clues", "Invalid triggers", invalid, [], "clues"));

  const usedClues = new Set<string>([
    ...b.scenes.flatMap((sc) => sc.hotspots.map((h) => h.clueId ?? "")),
    ...b.interviews.flatMap((i) => i.nodes.map((n) => n.clueId ?? "")),
    ...b.evidence.flatMap((e) => e.inspections.map((x) => x.revealsClueId ?? "")),
    ...b.triggers.flatMap((t) => t.actions.map((a) => a.targetId)),
  ]);
  out.push(result("unused", "Clues", "Unused clues", [], [...clues].filter((c) => !usedClues.has(c)).map((c) => `${b.clues.find((x) => x.id === c)?.code} is never discovered by any hotspot, dialogue or inspection`), "clues"));

  const sorted = [...b.timeline].sort((a, z) => a.correctOrder - z.correctOrder);
  const tlIssues: string[] = [];
  for (let i = 1; i < sorted.length; i++) { const cur = sorted[i]!, prev = sorted[i - 1]!; if (!cur.isClaim && !prev.isClaim && cur.time < prev.time) tlIssues.push(`"${cur.title}" (${cur.time}) is ordered after "${prev.title}" (${prev.time})`); }
  out.push(result("timeline", "Timeline", "Timeline inconsistencies", b.timeline.length === 0 ? ["Timeline is empty"] : [], tlIssues, "timeline"));

  out.push(result("reveal", "Reveal", "Missing reveal scenes", b.reveal.length === 0 ? ["Reveal sequence is empty"] : [], b.reveal.filter((r) => !r.image).map((r) => `Reveal "${r.title}" has no image`), "reveal"));

  const audioMissing = [
    ...b.reveal.filter((r) => !r.audio).map((r) => `Reveal "${r.title}" has no audio (optional)`),
  ];
  out.push(result("media", "Media", "Missing media", [], audioMissing.slice(0, 1).length ? [`${audioMissing.length} optional audio file(s) missing`] : [], "reveal"));

  out.push(result("translations", "Localisation", "Missing translations", [], b.interviews.length ? ["Sinhala (si) and Tamil (ta) dialogue translations not yet provided"] : [], "publish"));

  return out;
}

export function summarize(results: ValidationResult[]) {
  const errors = results.filter((r) => r.severity === "error").length;
  const warnings = results.filter((r) => r.severity === "warning").length;
  const passed = results.filter((r) => r.severity === "pass").length;
  return { errors, warnings, passed, canPublish: errors === 0, score: Math.round((passed + warnings * 0.5) / Math.max(1, results.length) * 100) };
}

export function completeness(b: CaseBundle) {
  const sections = [
    { key: "Story", ok: !!b.case.story && !!b.case.victim.name },
    { key: "Scenes", ok: b.scenes.length > 0 && b.scenes.every((s) => s.hotspots.length > 0) },
    { key: "Suspects", ok: b.suspects.length >= 2 },
    { key: "Evidence", ok: b.evidence.length >= 3 },
    { key: "Interviews", ok: b.interviews.length > 0 },
    { key: "Clues", ok: b.clues.length > 0 && b.triggers.length > 0 },
    { key: "Timeline", ok: b.timeline.length >= 3 },
    { key: "Solution", ok: !!b.solution.killerId && b.solution.requiredEvidenceIds.length > 0 },
    { key: "Reveal", ok: b.reveal.length > 0 },
  ];
  return { sections, percent: Math.round((sections.filter((s) => s.ok).length / sections.length) * 100) };
}
