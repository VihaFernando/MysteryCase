import { createFileRoute } from "@tanstack/react-router";
import { InterviewsLibrary } from "@/features/workspace/LibraryPages";

export const Route = createFileRoute("/_cms/interviews")({
  head: () => ({
    meta: [
      { title: "Interviews Library — MysteryCase CMS" },
    ],
  }),
  component: InterviewsLibrary,
});
