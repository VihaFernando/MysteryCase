import { createFileRoute } from "@tanstack/react-router";
import { SuspectsSection } from "@/features/suspects/SuspectsSection";

export const Route = createFileRoute("/_cms/cases/$caseId/suspects")({
  head: () => ({
    meta: [
      { title: "Suspects — MysteryCase CMS" },
      { name: "description", content: "Create suspects with public claims and hidden information." },
      { property: "og:title", content: "Suspects — MysteryCase CMS" },
      { property: "og:description", content: "Create suspects with public claims and hidden information." },
    ],
  }),
  component: SuspectsSection,
});
