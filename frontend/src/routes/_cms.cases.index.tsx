import { createFileRoute } from "@tanstack/react-router";
import { CasesPage } from "@/features/cases/CasesPage";

const STATUSES = ["draft", "review", "scheduled", "published", "archived"] as const;

export const Route = createFileRoute("/_cms/cases/")({
  validateSearch: (s: Record<string, unknown>): { status?: (typeof STATUSES)[number] | undefined } => {
    const status = STATUSES.find((x) => x === s["status"]);
    return status ? { status } : {};
  },
  head: () => ({
    meta: [
      { title: "Cases — MysteryCase CMS" },
    ],
  }),
  component: CasesRoute,
});

function CasesRoute() {
  const { status } = Route.useSearch();
  return <CasesPage {...(status ? { status } : {})} />;
}
