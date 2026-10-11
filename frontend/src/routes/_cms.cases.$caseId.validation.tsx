import { createFileRoute } from "@tanstack/react-router";
import { ValidationScreen } from "@/features/cases/publish/ValidationScreen";

export const Route = createFileRoute("/_cms/cases/$caseId/validation")({
  head: () => ({
    meta: [
      { title: "Validation — MysteryCase CMS" },
    ],
  }),
  component: ValidationScreen,
});
