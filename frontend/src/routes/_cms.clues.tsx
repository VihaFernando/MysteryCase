import { createFileRoute } from "@tanstack/react-router";
import { CluesLibrary } from "@/features/workspace/LibraryPages";

export const Route = createFileRoute("/_cms/clues")({
  head: () => ({
    meta: [
      { title: "Clues Library — MysteryCase CMS" },
    ],
  }),
  component: CluesLibrary,
});
