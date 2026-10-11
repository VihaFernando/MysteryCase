import { createFileRoute } from "@tanstack/react-router";
import { SuspectsSection } from "@/features/suspects/SuspectsSection";

export const Route = createFileRoute("/_cms/cases/$caseId/suspects")({
  head: () => ({
    meta: [
      { title: "Suspects — MysteryCase CMS" },
    ],
  }),
  component: SuspectsSection,
});
