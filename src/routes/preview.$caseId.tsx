import { createFileRoute } from "@tanstack/react-router";
import { PlayerPreview } from "@/features/preview/PlayerPreview";

export const Route = createFileRoute("/preview/$caseId")({
  head: () => ({
    meta: [
      { title: "Player Preview — MysteryCase CMS" },
      { name: "description", content: "Preview a case as players see it in the mobile app." },
      { property: "og:title", content: "Player Preview — MysteryCase CMS" },
      { property: "og:description", content: "Preview a case as players see it in the mobile app." },
    ],
  }),
  component: PreviewRoute,
});

function PreviewRoute() {
  const { caseId } = Route.useParams();
  return <PlayerPreview caseId={caseId} />;
}
