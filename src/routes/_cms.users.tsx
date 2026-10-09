import { createFileRoute } from "@tanstack/react-router";
import { UsersPage } from "@/features/workspace/UsersPage";

export const Route = createFileRoute("/_cms/users")({
  head: () => ({
    meta: [
      { title: "Users & Roles — MysteryCase CMS" },
      { name: "description", content: "Users & Roles for the MysteryCase content team." },
      { property: "og:title", content: "Users & Roles — MysteryCase CMS" },
      { property: "og:description", content: "Users & Roles for the MysteryCase content team." },
    ],
  }),
  component: UsersPage,
});
