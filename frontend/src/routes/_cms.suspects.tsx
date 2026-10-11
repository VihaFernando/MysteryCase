import { createFileRoute } from "@tanstack/react-router";
import { SuspectsLibrary } from "@/features/workspace/LibraryPages";

export const Route = createFileRoute("/_cms/suspects")({
  head: () => ({
    meta: [
      { title: "Suspects Library — MysteryCase CMS" },
    ],
  }),
  component: SuspectsLibrary,
});
