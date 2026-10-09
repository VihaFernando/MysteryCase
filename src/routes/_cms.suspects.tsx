import { createFileRoute } from "@tanstack/react-router";
import { SuspectsLibrary } from "@/features/workspace/LibraryPages";

export const Route = createFileRoute("/_cms/suspects")({
  head: () => ({
    meta: [
      { title: "Suspects Library — MysteryCase CMS" },
      { name: "description", content: "Suspects Library for the MysteryCase content team." },
      { property: "og:title", content: "Suspects Library — MysteryCase CMS" },
      { property: "og:description", content: "Suspects Library for the MysteryCase content team." },
    ],
  }),
  component: SuspectsLibrary,
});
