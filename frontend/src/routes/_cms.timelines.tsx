import { createFileRoute } from "@tanstack/react-router";
import { TimelinesLibrary } from "@/features/workspace/LibraryPages";

export const Route = createFileRoute("/_cms/timelines")({
  head: () => ({
    meta: [
      { title: "Timelines Library — MysteryCase CMS" },
    ],
  }),
  component: TimelinesLibrary,
});
