import { createFileRoute } from "@tanstack/react-router";
import { CluesSection } from "@/features/clues/CluesSection";

export const Route = createFileRoute("/_cms/cases/$caseId/clues")({
  head: () => ({
    meta: [
      { title: "Clues & Triggers — MysteryCase CMS" },
    ],
  }),
  component: CluesSection,
});
