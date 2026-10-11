import { createFileRoute } from "@tanstack/react-router";
import { RevealBuilder } from "@/features/reveals/RevealBuilder";

export const Route = createFileRoute("/_cms/cases/$caseId/reveal")({
  head: () => ({
    meta: [
      { title: "Reveal Builder — MysteryCase CMS" },
    ],
  }),
  component: RevealBuilder,
});
