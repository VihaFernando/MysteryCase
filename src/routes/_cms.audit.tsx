import { createFileRoute } from "@tanstack/react-router";
import { AuditPage } from "@/features/workspace/AuditPage";

export const Route = createFileRoute("/_cms/audit")({
  head: () => ({
    meta: [
      { title: "Audit Log — MysteryCase CMS" },
      { name: "description", content: "Audit Log for the MysteryCase content team." },
      { property: "og:title", content: "Audit Log — MysteryCase CMS" },
      { property: "og:description", content: "Audit Log for the MysteryCase content team." },
    ],
  }),
  component: AuditPage,
});
