import { createFileRoute } from "@tanstack/react-router";
import { NotificationsPage } from "@/features/workspace/NotificationsPage";

export const Route = createFileRoute("/_cms/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — MysteryCase CMS" },
      { name: "description", content: "Notifications for the MysteryCase content team." },
      { property: "og:title", content: "Notifications — MysteryCase CMS" },
      { property: "og:description", content: "Notifications for the MysteryCase content team." },
    ],
  }),
  component: NotificationsPage,
});
