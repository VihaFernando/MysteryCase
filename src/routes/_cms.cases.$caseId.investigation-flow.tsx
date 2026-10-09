import { createFileRoute } from "@tanstack/react-router";
import { InvestigationFlowPage } from "@/features/investigation-flow/InvestigationFlowPage";

export const Route = createFileRoute("/_cms/cases/$caseId/investigation-flow")({
  head: () => ({
    meta: [
      { title: "Investigation Flow — MysteryCase CMS" },
      { name: "description", content: "Visual case progression and relationship graph." },
      { property: "og:title", content: "Investigation Flow — MysteryCase CMS" },
      { property: "og:description", content: "Visual case progression and relationship graph." },
    ],
  }),
  component: InvestigationFlowPage,
});
