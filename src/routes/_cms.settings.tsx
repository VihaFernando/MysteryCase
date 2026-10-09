import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/features/workspace/SettingsPage";

export const Route = createFileRoute("/_cms/settings")({
  head: () => ({
    meta: [
      { title: "Settings — MysteryCase CMS" },
      { name: "description", content: "Settings for the MysteryCase content team." },
      { property: "og:title", content: "Settings — MysteryCase CMS" },
      { property: "og:description", content: "Settings for the MysteryCase content team." },
    ],
  }),
  component: SettingsPage,
});
