import { createFileRoute } from "@tanstack/react-router";
import { TimelineBuilder } from "@/features/timelines/TimelineBuilder";

export const Route = createFileRoute("/_cms/cases/$caseId/timeline")({
  head: () => ({
    meta: [
      { title: "Timeline Builder — MysteryCase CMS" },
      { name: "description", content: "Order the true and claimed events of the case." },
      { property: "og:title", content: "Timeline Builder — MysteryCase CMS" },
      { property: "og:description", content: "Order the true and claimed events of the case." },
    ],
  }),
  component: TimelineBuilder,
});
