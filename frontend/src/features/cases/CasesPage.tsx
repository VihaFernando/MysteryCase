import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Archive, Copy, Eye, Globe, LayoutGrid, MoreHorizontal, Pencil, Plus, Rows3, Search, Trash2, Undo2, Briefcase } from "lucide-react";
import { useCaseActions, useCases } from "@/hooks/queries";
import { EmptyState, ErrorState, PageHeader, TableSkeleton } from "@/components/common/Page";
import { CaseStatusBadge, DifficultyBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { fmtAgo } from "@/utils/format";
import { cn } from "@/lib/utils";
import type { Case, CaseStatus } from "@/types";

const FILTERS: Array<{ key: CaseStatus | "all"; label: string }> = [
  { key: "all", label: "All" }, { key: "draft", label: "Draft" }, { key: "review", label: "Review" },
  { key: "published", label: "Published" }, { key: "scheduled", label: "Scheduled" }, { key: "archived", label: "Archived" },
];
type Sort = "updated" | "created" | "played" | "rated";
const PAGE = 8;

export function CasesPage({ status }: { status?: CaseStatus }) {
  const navigate = useNavigate();
  const { data, isLoading, error, refetch } = useCases();
  const actions = useCaseActions();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("updated");
  const [view, setView] = useState<"table" | "grid">("table");
  const [page, setPage] = useState(0);
  const [confirm, setConfirm] = useState<{ kind: "archive" | "delete" | "publish" | "unpublish"; c: Case } | null>(null);
  const filter = status ?? "all";

  const rows = useMemo(() => {
    const term = q.toLowerCase();
    const list = (data ?? []).filter((c) => (filter === "all" || c.status === filter) && (!term || `${c.code} ${c.title} ${c.type} ${c.tags.join(" ")}`.toLowerCase().includes(term)));
    const sorters: Record<Sort, (a: Case, b: Case) => number> = {
      updated: (a, b) => b.updatedAt.localeCompare(a.updatedAt),
      created: (a, b) => b.createdAt.localeCompare(a.createdAt),
      played: (a, b) => b.stats.players - a.stats.players,
      rated: (a, b) => b.stats.rating - a.stats.rating,
    };
    return list.sort(sorters[sort]);
  }, [data, q, sort, filter]);
  const pages = Math.max(1, Math.ceil(rows.length / PAGE));
  const visible = rows.slice(page * PAGE, page * PAGE + PAGE);

  const runConfirm = async () => {
    if (!confirm) return;
    const { kind, c } = confirm;
    if (kind === "delete") { await actions.remove.mutateAsync(c.id); toast.success(`${c.code} deleted`); }
    else {
      const map = { archive: "archived", publish: "published", unpublish: "draft" } as const;
      await actions.setStatus.mutateAsync({ id: c.id, status: map[kind] });
      toast.success(`${c.code} ${kind === "unpublish" ? "unpublished" : `${kind}ed`}`);
    }
    setConfirm(null);
  };

  const duplicate = async (c: Case) => {
    const copy = await actions.duplicate.mutateAsync(c.id);
    toast.success(`Duplicated as ${copy.case.code}`, { action: { label: "Open", onClick: () => navigate({ to: "/cases/$caseId", params: { caseId: copy.case.id } }) } });
  };

  const menu = (c: Case) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-7"><MoreHorizontal className="size-3.5" /></Button></DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuItem asChild><Link to="/cases/$caseId/basic-info" params={{ caseId: c.id }}><Pencil className="size-3.5" />Edit</Link></DropdownMenuItem>
        <DropdownMenuItem onClick={() => duplicate(c)}><Copy className="size-3.5" />Duplicate</DropdownMenuItem>
        <DropdownMenuItem asChild><Link to="/preview/$caseId" params={{ caseId: c.id }}><Eye className="size-3.5" />Preview</Link></DropdownMenuItem>
        <DropdownMenuSeparator />
        {c.status === "published"
          ? <DropdownMenuItem onClick={() => setConfirm({ kind: "unpublish", c })}><Undo2 className="size-3.5" />Unpublish</DropdownMenuItem>
          : <DropdownMenuItem onClick={() => navigate({ to: "/cases/$caseId/publish", params: { caseId: c.id } })}><Globe className="size-3.5" />Publish…</DropdownMenuItem>}
        {c.status !== "archived" && <DropdownMenuItem onClick={() => setConfirm({ kind: "archive", c })}><Archive className="size-3.5" />Archive</DropdownMenuItem>}
        <DropdownMenuItem className="text-crimson" onClick={() => setConfirm({ kind: "delete", c })}><Trash2 className="size-3.5" />Delete</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <div className="space-y-4 p-6">
      <PageHeader title="Cases" subtitle="Every investigation in the workspace, from first draft to live release."
        actions={<Button size="sm" asChild><Link to="/cases/new"><Plus className="size-3.5" />Create New Case</Link></Button>} />

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-md border border-border bg-card p-0.5">
          {FILTERS.map((f) => {
            const count = f.key === "all" ? data?.length : data?.filter((c) => c.status === f.key).length;
            return (
              <Link key={f.key} to="/cases" search={f.key === "all" ? {} : { status: f.key }} onClick={() => setPage(0)}
                className={cn("rounded-[4px] px-2.5 py-1 text-xs", filter === f.key ? "bg-accent font-medium text-foreground" : "text-muted-foreground hover:text-foreground")}>
                {f.label} <span className="ml-1 font-mono text-[10px] opacity-60">{count ?? "–"}</span>
              </Link>
            );
          })}
        </div>
        <div className="relative ml-auto w-64">
          <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Search by title, ID, tag…" className="h-8 pl-8 text-xs" />
        </div>
        <Select value={sort} onValueChange={(v) => setSort(v as Sort)}>
          <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="updated">Recently updated</SelectItem>
            <SelectItem value="created">Recently created</SelectItem>
            <SelectItem value="played">Most played</SelectItem>
            <SelectItem value="rated">Highest rated</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex rounded-md border border-border p-0.5">
          <Button variant={view === "table" ? "secondary" : "ghost"} size="icon" className="size-7" onClick={() => setView("table")} aria-label="Table view"><Rows3 className="size-3.5" /></Button>
          <Button variant={view === "grid" ? "secondary" : "ghost"} size="icon" className="size-7" onClick={() => setView("grid")} aria-label="Grid view"><LayoutGrid className="size-3.5" /></Button>
        </div>
      </div>

      {error ? <ErrorState message="Could not load cases." onRetry={() => refetch()} /> : isLoading ? <TableSkeleton /> : rows.length === 0 ? (
        <EmptyState icon={Briefcase} title="No cases match" body="Try a different filter or start a new investigation." action={<Button size="sm" asChild><Link to="/cases/new">Create New Case</Link></Button>} />
      ) : view === "table" ? (
        <div className="overflow-hidden rounded-md border border-border bg-card">
          <table className="w-full text-xs">
            <thead className="label-caps border-b border-border bg-muted/40 text-left">
              <tr>{["Case ID", "Cover", "Title", "Type", "Difficulty", "Status", "Version", "Updated", ""].map((h) => <th key={h} className="px-3 py-2 font-normal">{h}</th>)}</tr>
            </thead>
            <tbody>
              {visible.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-accent/40">
                  <td className="px-3 py-2 font-mono text-[11px] text-muted-foreground">{c.code}</td>
                  <td className="px-3 py-2"><img src={c.coverImage} alt="" className="h-10 w-8 rounded-sm object-cover" loading="lazy" /></td>
                  <td className="px-3 py-2">
                    <Link to="/cases/$caseId" params={{ caseId: c.id }} className="font-medium hover:underline">{c.title}</Link>
                    <div className="max-w-xs truncate text-[11px] text-muted-foreground">{c.tagline}</div>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{c.type}</td>
                  <td className="px-3 py-2"><DifficultyBadge difficulty={c.difficulty} /></td>
                  <td className="px-3 py-2"><CaseStatusBadge status={c.status} /></td>
                  <td className="px-3 py-2 font-mono">v{c.version}</td>
                  <td className="px-3 py-2 text-muted-foreground">{fmtAgo(c.updatedAt)}</td>
                  <td className="px-3 py-2 text-right">{menu(c)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {visible.map((c) => (
            <div key={c.id} className="overflow-hidden rounded-md border border-border bg-card">
              <Link to="/cases/$caseId" params={{ caseId: c.id }} className="relative block aspect-[4/3]">
                <img src={c.coverImage} alt={c.title} className="h-full w-full object-cover" loading="lazy" />
                <div className="absolute left-2 top-2"><CaseStatusBadge status={c.status} /></div>
              </Link>
              <div className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0"><div className="font-mono text-[10px] text-muted-foreground">{c.code} · v{c.version}</div><div className="truncate font-display font-semibold">{c.title}</div></div>
                  {menu(c)}
                </div>
                <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground"><DifficultyBadge difficulty={c.difficulty} /><span>{fmtAgo(c.updatedAt)}</span></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {rows.length > PAGE && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Showing {page * PAGE + 1}–{Math.min(rows.length, (page + 1) * PAGE)} of {rows.length}</span>
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        onOpenChange={(o) => !o && setConfirm(null)}
        title={confirm ? `${confirm.kind.charAt(0).toUpperCase()}${confirm.kind.slice(1)} ${confirm.c.code}?` : ""}
        description={confirm?.kind === "delete" ? "This permanently removes the case and all its content." : confirm?.kind === "unpublish" ? "Players will no longer be able to start this case." : "You can restore it later from the Archived filter."}
        destructive={confirm?.kind === "delete"}
        confirmLabel={confirm?.kind ?? ""}
        onConfirm={runConfirm}
      />
    </div>
  );
}
