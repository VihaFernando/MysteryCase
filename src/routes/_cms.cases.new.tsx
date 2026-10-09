import { createFileRoute } from "@tanstack/react-router";
import { CaseWizard } from "@/features/cases/wizard/CaseWizard";

export const Route = createFileRoute("/_cms/cases/new")({
  head: () => ({
    meta: [
      { title: "New Case — MysteryCase CMS" },
      { name: "description", content: "Step-by-step wizard to set up a new detective case." },
      { property: "og:title", content: "New Case — MysteryCase CMS" },
      { property: "og:description", content: "Step-by-step wizard to set up a new detective case." },
    ],
  }),
  component: CaseWizard,
});
