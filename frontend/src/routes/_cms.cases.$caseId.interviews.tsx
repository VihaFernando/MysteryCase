import { createFileRoute } from "@tanstack/react-router";
import { InterviewBuilder } from "@/features/interviews/InterviewBuilder";

export const Route = createFileRoute("/_cms/cases/$caseId/interviews")({
  head: () => ({
    meta: [
      { title: "Interview Builder — MysteryCase CMS" },
    ],
  }),
  component: InterviewBuilder,
});
