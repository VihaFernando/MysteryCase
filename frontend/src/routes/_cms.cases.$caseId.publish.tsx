import { createFileRoute } from "@tanstack/react-router";
import { PublishSection } from "@/features/cases/publish/PublishSection";

export const Route = createFileRoute("/_cms/cases/$caseId/publish")({
  head: () => ({
    meta: [
      { title: "Publish — MysteryCase CMS" },
    ],
  }),
  component: PublishSection,
});
