export const CASE_SECTIONS = [
  { key: "basic-info", label: "Basic Info", to: "/cases/$caseId/basic-info" },
  { key: "scenes", label: "Scenes", to: "/cases/$caseId/scenes" },
  { key: "suspects", label: "Suspects", to: "/cases/$caseId/suspects" },
  { key: "evidence", label: "Evidence", to: "/cases/$caseId/evidence" },
  { key: "interviews", label: "Interviews", to: "/cases/$caseId/interviews" },
  { key: "clues", label: "Clues", to: "/cases/$caseId/clues" },
  { key: "timeline", label: "Timeline", to: "/cases/$caseId/timeline" },
  { key: "investigation-flow", label: "Investigation Flow", to: "/cases/$caseId/investigation-flow" },
  { key: "solution", label: "Solution", to: "/cases/$caseId/solution" },
  { key: "reveal", label: "Reveal", to: "/cases/$caseId/reveal" },
  { key: "testing", label: "Testing", to: "/cases/$caseId/testing" },
  { key: "publish", label: "Publish", to: "/cases/$caseId/publish" },
] as const;

export type CaseSectionKey = (typeof CASE_SECTIONS)[number]["key"];

export const sectionPath = (key: string) => (CASE_SECTIONS.find((s) => s.key === key) ?? CASE_SECTIONS[0]).to;
