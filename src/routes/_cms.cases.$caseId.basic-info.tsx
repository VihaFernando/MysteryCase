import { createFileRoute } from "@tanstack/react-router";
import { BasicInfoSection } from "@/features/cases/editor/BasicInfoSection";

export const Route = createFileRoute("/_cms/cases/$caseId/basic-info")({
  head: () => ({
    meta: [
      { title: "Basic Info — MysteryCase CMS" },
      { name: "description", content: "Edit the case title, story, victim and metadata." },
      { property: "og:title", content: "Basic Info — MysteryCase CMS" },
      { property: "og:description", content: "Edit the case title, story, victim and metadata." },
    ],
  }),
  component: BasicInfoSection,
});
