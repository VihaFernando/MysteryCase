import { createFileRoute } from "@tanstack/react-router";
import { InterviewsLibrary } from "@/features/workspace/LibraryPages";

export const Route = createFileRoute("/_cms/interviews")({
  head: () => ({
    meta: [
      { title: "Interviews Library — MysteryCase CMS" },
      { name: "description", content: "Interviews Library for the MysteryCase content team." },
      { property: "og:title", content: "Interviews Library — MysteryCase CMS" },
      { property: "og:description", content: "Interviews Library for the MysteryCase content team." },
    ],
  }),
  component: InterviewsLibrary,
});
