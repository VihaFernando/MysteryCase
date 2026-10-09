import { createFileRoute } from "@tanstack/react-router";
import { PlayersPage } from "@/features/workspace/PlayersPage";

export const Route = createFileRoute("/_cms/players")({
  head: () => ({
    meta: [
      { title: "Players — MysteryCase CMS" },
      { name: "description", content: "Players for the MysteryCase content team." },
      { property: "og:title", content: "Players — MysteryCase CMS" },
      { property: "og:description", content: "Players for the MysteryCase content team." },
    ],
  }),
  component: PlayersPage,
});
