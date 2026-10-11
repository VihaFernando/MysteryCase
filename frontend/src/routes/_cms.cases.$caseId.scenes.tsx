import { createFileRoute } from "@tanstack/react-router";
import { SceneBuilder } from "@/features/crime-scenes/SceneBuilder";

export const Route = createFileRoute("/_cms/cases/$caseId/scenes")({
  head: () => ({
    meta: [
      { title: "Crime Scene Builder — MysteryCase CMS" },
    ],
  }),
  component: SceneBuilder,
});
