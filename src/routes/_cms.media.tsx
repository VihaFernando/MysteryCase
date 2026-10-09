import { createFileRoute } from "@tanstack/react-router";
import { MediaPage } from "@/features/workspace/MediaPage";

export const Route = createFileRoute("/_cms/media")({
  head: () => ({
    meta: [
      { title: "Media Library — MysteryCase CMS" },
      { name: "description", content: "Media Library for the MysteryCase content team." },
      { property: "og:title", content: "Media Library — MysteryCase CMS" },
      { property: "og:description", content: "Media Library for the MysteryCase content team." },
    ],
  }),
  component: MediaPage,
});
