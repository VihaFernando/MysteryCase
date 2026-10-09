import { createFileRoute } from "@tanstack/react-router";
import { SolutionSection } from "@/features/solutions/SolutionSection";

export const Route = createFileRoute("/_cms/cases/$caseId/solution")({
  head: () => ({
    meta: [
      { title: "Solution — MysteryCase CMS" },
      { name: "description", content: "Theories, hints, final solution and scoring." },
      { property: "og:title", content: "Solution — MysteryCase CMS" },
      { property: "og:description", content: "Theories, hints, final solution and scoring." },
    ],
  }),
  component: SolutionSection,
});
