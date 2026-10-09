import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    throw redirect({ to: "/dashboard" });
  },
  head: () => ({
    meta: [
      { title: "MysteryCase CMS" },
      { name: "description", content: "Author, test and publish interactive detective cases." },
      { property: "og:title", content: "MysteryCase CMS" },
      { property: "og:description", content: "Author, test and publish interactive detective cases." },
    ],
  }),
});
