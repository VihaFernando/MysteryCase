import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/features/dashboard/DashboardPage";

export const Route = createFileRoute("/_cms/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — MysteryCase CMS" },
    ],
  }),
  component: DashboardPage,
});
