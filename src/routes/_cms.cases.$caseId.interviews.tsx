import { createFileRoute } from "@tanstack/react-router";
import { InterviewBuilder } from "@/features/interviews/InterviewBuilder";

export const Route = createFileRoute("/_cms/cases/$caseId/interviews")({
  head: () => ({
    meta: [
      { title: "Interview Builder — MysteryCase CMS" },
      { name: "description", content: "Visual branching dialogue editor for suspect interviews." },
      { property: "og:title", content: "Interview Builder — MysteryCase CMS" },
      { property: "og:description", content: "Visual branching dialogue editor for suspect interviews." },
    ],
  }),
  component: InterviewBuilder,
});
