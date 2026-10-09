import { createFileRoute } from "@tanstack/react-router";
import { TestingPanel } from "@/features/cases/testing/TestingPanel";

export const Route = createFileRoute("/_cms/cases/$caseId/testing")({
  head: () => ({
    meta: [
      { title: "Testing — MysteryCase CMS" },
      { name: "description", content: "QA panel for simulating player state and conditions." },
      { property: "og:title", content: "Testing — MysteryCase CMS" },
      { property: "og:description", content: "QA panel for simulating player state and conditions." },
    ],
  }),
  component: TestingPanel,
});
