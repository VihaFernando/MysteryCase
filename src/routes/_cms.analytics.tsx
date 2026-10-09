import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsPage } from "@/features/workspace/AnalyticsPage";

export const Route = createFileRoute("/_cms/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — MysteryCase CMS" },
      { name: "description", content: "Analytics for the MysteryCase content team." },
      { property: "og:title", content: "Analytics — MysteryCase CMS" },
      { property: "og:description", content: "Analytics for the MysteryCase content team." },
    ],
  }),
  component: AnalyticsPage,
});
