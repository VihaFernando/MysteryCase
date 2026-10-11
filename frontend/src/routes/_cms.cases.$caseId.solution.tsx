import { createFileRoute } from "@tanstack/react-router";
import { SolutionSection } from "@/features/solutions/SolutionSection";

export const Route = createFileRoute("/_cms/cases/$caseId/solution")({
  head: () => ({
    meta: [
      { title: "Solution — MysteryCase CMS" },
    ],
  }),
  component: SolutionSection,
});
