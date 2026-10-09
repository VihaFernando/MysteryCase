import { createFileRoute } from "@tanstack/react-router";
import { SceneBuilder } from "@/features/crime-scenes/SceneBuilder";

export const Route = createFileRoute("/_cms/cases/$caseId/scenes")({
  head: () => ({
    meta: [
      { title: "Crime Scene Builder — MysteryCase CMS" },
      { name: "description", content: "Place and edit interactive hotspots on crime scene images." },
      { property: "og:title", content: "Crime Scene Builder — MysteryCase CMS" },
      { property: "og:description", content: "Place and edit interactive hotspots on crime scene images." },
    ],
  }),
  component: SceneBuilder,
});
