import { createFileRoute } from "@tanstack/react-router";
import { PublishSection } from "@/features/cases/publish/PublishSection";

export const Route = createFileRoute("/_cms/cases/$caseId/publish")({
  head: () => ({
    meta: [
      { title: "Publish — MysteryCase CMS" },
      { name: "description", content: "Case health, completeness and release settings." },
      { property: "og:title", content: "Publish — MysteryCase CMS" },
      { property: "og:description", content: "Case health, completeness and release settings." },
    ],
  }),
  component: PublishSection,
});
