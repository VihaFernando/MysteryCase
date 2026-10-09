import { createFileRoute } from "@tanstack/react-router";
import { EvidenceLibrary } from "@/features/workspace/LibraryPages";

export const Route = createFileRoute("/_cms/evidence")({
  head: () => ({
    meta: [
      { title: "Evidence Library — MysteryCase CMS" },
      { name: "description", content: "Evidence Library for the MysteryCase content team." },
      { property: "og:title", content: "Evidence Library — MysteryCase CMS" },
      { property: "og:description", content: "Evidence Library for the MysteryCase content team." },
    ],
  }),
  component: EvidenceLibrary,
});
