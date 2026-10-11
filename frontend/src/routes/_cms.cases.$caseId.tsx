import { createFileRoute } from "@tanstack/react-router";
import { CaseEditorLayout } from "@/features/cases/editor/CaseEditorLayout";

export const Route = createFileRoute("/_cms/cases/$caseId")({
  head: () => ({
    meta: [
      { title: "Case Editor — MysteryCase CMS" },
    ],
  }),
  component: EditorRoute,
});

function EditorRoute() {
  const { caseId } = Route.useParams();
  return <CaseEditorLayout caseId={caseId} />;
}
