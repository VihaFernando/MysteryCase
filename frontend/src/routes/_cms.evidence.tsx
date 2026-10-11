import { createFileRoute } from "@tanstack/react-router";
import { EvidenceLibrary } from "@/features/workspace/LibraryPages";

export const Route = createFileRoute("/_cms/evidence")({
  head: () => ({
    meta: [
      { title: "Evidence Library — MysteryCase CMS" },
    ],
  }),
  component: EvidenceLibrary,
});
