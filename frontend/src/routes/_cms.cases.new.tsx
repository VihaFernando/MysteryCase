import { createFileRoute } from "@tanstack/react-router";
import { CaseWizard } from "@/features/cases/wizard/CaseWizard";

export const Route = createFileRoute("/_cms/cases/new")({
  head: () => ({
    meta: [
      { title: "New Case — MysteryCase CMS" },
    ],
  }),
  component: CaseWizard,
});
