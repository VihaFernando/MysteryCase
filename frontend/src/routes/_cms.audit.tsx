import { createFileRoute } from "@tanstack/react-router";
import { AuditPage } from "@/features/workspace/AuditPage";

export const Route = createFileRoute("/_cms/audit")({
  head: () => ({
    meta: [
      { title: "Audit Log — MysteryCase CMS" },
    ],
  }),
  component: AuditPage,
});
