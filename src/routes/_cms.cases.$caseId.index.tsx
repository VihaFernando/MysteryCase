import { createFileRoute } from "@tanstack/react-router";
import { CaseOverview } from "@/features/cases/editor/CaseOverview";

export const Route = createFileRoute("/_cms/cases/$caseId/")({
  head: () => ({
    meta: [
      { title: "Case Overview — MysteryCase CMS" },
      { name: "description", content: "Case summary, status, versions and player statistics." },
      { property: "og:title", content: "Case Overview — MysteryCase CMS" },
      { property: "og:description", content: "Case summary, status, versions and player statistics." },
    ],
  }),
  component: CaseOverview,
});
