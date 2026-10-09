import { createFileRoute } from "@tanstack/react-router";
import { ValidationScreen } from "@/features/cases/publish/ValidationScreen";

export const Route = createFileRoute("/_cms/cases/$caseId/validation")({
  head: () => ({
    meta: [
      { title: "Validation — MysteryCase CMS" },
      { name: "description", content: "Pre-publish validation of case content." },
      { property: "og:title", content: "Validation — MysteryCase CMS" },
      { property: "og:description", content: "Pre-publish validation of case content." },
    ],
  }),
  component: ValidationScreen,
});
