import { createFileRoute } from "@tanstack/react-router";
import { CluesLibrary } from "@/features/workspace/LibraryPages";

export const Route = createFileRoute("/_cms/clues")({
  head: () => ({
    meta: [
      { title: "Clues Library — MysteryCase CMS" },
      { name: "description", content: "Clues Library for the MysteryCase content team." },
      { property: "og:title", content: "Clues Library — MysteryCase CMS" },
      { property: "og:description", content: "Clues Library for the MysteryCase content team." },
    ],
  }),
  component: CluesLibrary,
});
