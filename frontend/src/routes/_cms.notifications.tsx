import { createFileRoute } from "@tanstack/react-router";
import { NotificationsPage } from "@/features/workspace/NotificationsPage";

export const Route = createFileRoute("/_cms/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — MysteryCase CMS" },
    ],
  }),
  component: NotificationsPage,
});
