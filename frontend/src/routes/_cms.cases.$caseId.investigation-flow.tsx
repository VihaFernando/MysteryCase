import { createFileRoute } from "@tanstack/react-router";
import { InvestigationFlowPage } from "@/features/investigation-flow/InvestigationFlowPage";

export const Route = createFileRoute("/_cms/cases/$caseId/investigation-flow")({
  head: () => ({
    meta: [
      { title: "Investigation Flow — MysteryCase CMS" },
    ],
  }),
  component: InvestigationFlowPage,
});
