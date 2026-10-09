import { createFileRoute } from "@tanstack/react-router";
import { EvidenceSection } from "@/features/evidence/EvidenceSection";

export const Route = createFileRoute("/_cms/cases/$caseId/evidence")({
  head: () => ({
    meta: [
      { title: "Evidence — MysteryCase CMS" },
      { name: "description", content: "Manage evidence items and their inspection stages." },
      { property: "og:title", content: "Evidence — MysteryCase CMS" },
      { property: "og:description", content: "Manage evidence items and their inspection stages." },
    ],
  }),
  component: EvidenceSection,
});
