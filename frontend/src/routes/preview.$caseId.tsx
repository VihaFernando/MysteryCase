import { createFileRoute } from "@tanstack/react-router";
import { PlayerPreview } from "@/features/preview/PlayerPreview";

export const Route = createFileRoute("/preview/$caseId")({
  head: () => ({
    meta: [
      { title: "Player Preview — MysteryCase CMS" },
    ],
  }),
  component: PreviewRoute,
});

function PreviewRoute() {
  const { caseId } = Route.useParams();
  return <PlayerPreview caseId={caseId} />;
}
