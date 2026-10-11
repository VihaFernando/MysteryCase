import { createFileRoute } from "@tanstack/react-router";
import { PlayersPage } from "@/features/workspace/PlayersPage";

export const Route = createFileRoute("/_cms/players")({
  head: () => ({
    meta: [
      { title: "Players — MysteryCase CMS" },
    ],
  }),
  component: PlayersPage,
});
