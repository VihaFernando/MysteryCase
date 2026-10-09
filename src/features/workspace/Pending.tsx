import { Construction } from "lucide-react";
import { EmptyState } from "@/components/common/Page";

/** Placeholder for screens not yet built. See PENDING_TASKS.md. */
export function Pending({ title }: { title: string }) {
  return <div className="p-6"><EmptyState icon={Construction} title={`${title} — coming soon`} body="This screen is listed in PENDING_TASKS.md." /></div>;
}
