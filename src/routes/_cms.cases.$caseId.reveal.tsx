import { createFileRoute } from "@tanstack/react-router";
import { RevealBuilder } from "@/features/reveals/RevealBuilder";

export const Route = createFileRoute("/_cms/cases/$caseId/reveal")({
  head: () => ({
    meta: [
      { title: "Reveal Builder — MysteryCase CMS" },
      { name: "description", content: "Cinematic reveal sequence editor." },
      { property: "og:title", content: "Reveal Builder — MysteryCase CMS" },
      { property: "og:description", content: "Cinematic reveal sequence editor." },
    ],
  }),
  component: RevealBuilder,
});
