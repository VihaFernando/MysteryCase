import { createFileRoute } from "@tanstack/react-router";
import { MediaPage } from "@/features/workspace/MediaPage";

export const Route = createFileRoute("/_cms/media")({
  head: () => ({
    meta: [
      { title: "Media Library — MysteryCase CMS" },
    ],
  }),
  component: MediaPage,
});
