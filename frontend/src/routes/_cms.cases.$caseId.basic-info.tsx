import { createFileRoute } from "@tanstack/react-router";
import { BasicInfoSection } from "@/features/cases/editor/BasicInfoSection";

export const Route = createFileRoute("/_cms/cases/$caseId/basic-info")({
  head: () => ({
    meta: [
      { title: "Basic Info — MysteryCase CMS" },
    ],
  }),
  component: BasicInfoSection,
});
