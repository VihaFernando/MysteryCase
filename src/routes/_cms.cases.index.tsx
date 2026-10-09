import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { CasesPage } from "@/features/cases/CasesPage";

const search = z.object({ status: z.enum(["draft", "review", "scheduled", "published", "archived"]).optional().catch(undefined) });

export const Route = createFileRoute("/_cms/cases/")({
  validateSearch: (s: Record<string, unknown>) => search.parse(s),
  head: () => ({
    meta: [
      { title: "Cases — MysteryCase CMS" },
      { name: "description", content: "Browse, filter and manage every MysteryCase investigation." },
      { property: "og:title", content: "Cases — MysteryCase CMS" },
      { property: "og:description", content: "Browse, filter and manage every MysteryCase investigation." },
    ],
  }),
  component: CasesRoute,
});

function CasesRoute() {
  const { status } = Route.useSearch();
  return <CasesPage {...(status ? { status } : {})} />;
}
