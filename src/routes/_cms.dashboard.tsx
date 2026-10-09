import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/features/dashboard/DashboardPage";

export const Route = createFileRoute("/_cms/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — MysteryCase CMS" },
      { name: "description", content: "Case pipeline, recent cases, popular cases and team activity." },
      { property: "og:title", content: "Dashboard — MysteryCase CMS" },
      { property: "og:description", content: "Case pipeline, recent cases, popular cases and team activity." },
    ],
  }),
  component: DashboardPage,
});
