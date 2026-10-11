import { createFileRoute } from "@tanstack/react-router";
import { AnalyticsPage } from "@/features/workspace/AnalyticsPage";

export const Route = createFileRoute("/_cms/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — MysteryCase CMS" },
    ],
  }),
  component: AnalyticsPage,
});
