import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/features/workspace/SettingsPage";

export const Route = createFileRoute("/_cms/settings")({
  head: () => ({
    meta: [
      { title: "Settings — MysteryCase CMS" },
    ],
  }),
  component: SettingsPage,
});
