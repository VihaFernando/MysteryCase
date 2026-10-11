import { createFileRoute } from "@tanstack/react-router";
import { EvidenceSection } from "@/features/evidence/EvidenceSection";

export const Route = createFileRoute("/_cms/cases/$caseId/evidence")({
  head: () => ({
    meta: [
      { title: "Evidence — MysteryCase CMS" },
    ],
  }),
  component: EvidenceSection,
});
