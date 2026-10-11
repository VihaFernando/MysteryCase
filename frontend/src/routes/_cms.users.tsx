import { createFileRoute } from "@tanstack/react-router";
import { UsersPage } from "@/features/workspace/UsersPage";

export const Route = createFileRoute("/_cms/users")({
  head: () => ({
    meta: [
      { title: "Users & Roles — MysteryCase CMS" },
    ],
  }),
  component: UsersPage,
});
