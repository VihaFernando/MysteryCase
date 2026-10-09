import { createFileRoute } from "@tanstack/react-router";
import { CluesSection } from "@/features/clues/CluesSection";

export const Route = createFileRoute("/_cms/cases/$caseId/clues")({
  head: () => ({
    meta: [
      { title: "Clues & Triggers — MysteryCase CMS" },
      { name: "description", content: "Clues, relationships, triggers and unlock conditions." },
      { property: "og:title", content: "Clues & Triggers — MysteryCase CMS" },
      { property: "og:description", content: "Clues, relationships, triggers and unlock conditions." },
    ],
  }),
  component: CluesSection,
});
