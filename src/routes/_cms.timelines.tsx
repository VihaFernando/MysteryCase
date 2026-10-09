import { createFileRoute } from "@tanstack/react-router";
import { TimelinesLibrary } from "@/features/workspace/LibraryPages";

export const Route = createFileRoute("/_cms/timelines")({
  head: () => ({
    meta: [
      { title: "Timelines Library — MysteryCase CMS" },
      { name: "description", content: "Timelines Library for the MysteryCase content team." },
      { property: "og:title", content: "Timelines Library — MysteryCase CMS" },
      { property: "og:description", content: "Timelines Library for the MysteryCase content team." },
    ],
  }),
  component: TimelinesLibrary,
});
