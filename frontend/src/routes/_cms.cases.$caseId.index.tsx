import { createFileRoute } from "@tanstack/react-router";
import { CaseOverview } from "@/features/cases/editor/CaseOverview";

export const Route = createFileRoute("/_cms/cases/$caseId/")({
  head: () => ({
    meta: [
      { title: "Case Overview — MysteryCase CMS" },
    ],
  }),
  component: CaseOverview,
});
