import { createFileRoute } from "@tanstack/react-router";
import { TimelineBuilder } from "@/features/timelines/TimelineBuilder";

export const Route = createFileRoute("/_cms/cases/$caseId/timeline")({
  head: () => ({
    meta: [
      { title: "Timeline Builder — MysteryCase CMS" },
    ],
  }),
  component: TimelineBuilder,
});
