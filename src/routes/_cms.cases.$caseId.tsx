import { createFileRoute } from "@tanstack/react-router";
import { CaseEditorLayout } from "@/features/cases/editor/CaseEditorLayout";

export const Route = createFileRoute("/_cms/cases/$caseId")({
  head: () => ({
    meta: [
      { title: "Case Editor — MysteryCase CMS" },
      { name: "description", content: "Build scenes, suspects, evidence, interviews and the solution for a case." },
      { property: "og:title", content: "Case Editor — MysteryCase CMS" },
      { property: "og:description", content: "Build scenes, suspects, evidence, interviews and the solution for a case." },
    ],
  }),
  component: EditorRoute,
});

function EditorRoute() {
  const { caseId } = Route.useParams();
  return <CaseEditorLayout caseId={caseId} />;
}
