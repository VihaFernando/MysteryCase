import { createFileRoute } from "@tanstack/react-router";
import { TestingPanel } from "@/features/cases/testing/TestingPanel";

export const Route = createFileRoute("/_cms/cases/$caseId/testing")({
  head: () => ({
    meta: [
      { title: "Testing — MysteryCase CMS" },
    ],
  }),
  component: TestingPanel,
});
