import { useMemo, useState } from "react";
import { ScrollText, Search } from "lucide-react";
import { useAudit, useUsers } from "@/hooks/queries";
import { EmptyState, ErrorState, PageHeader, TableSkeleton } from "@/components/common/Page";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmtDateTime } from "@/utils/format";

export function AuditPage() {
  const { data = [], isLoading, error, refetch } = useAudit();
  const { data: users = [] } = useUsers();
  const [q, setQ] = useState("");
  const [user, setUser] = useState("all");
  const name = (id: string) => users.find((u) => u.id === id)?.name ?? id;

  const rows = useMemo(
    () => [...data].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).filter((e) => (user === "all" || e.userId === user) && `${e.action} ${e.resource} ${e.oldValue ?? ""} ${e.newValue ?? ""}`.toLowerCase().includes(q.toLowerCase())),
    [data, q, user],
  );

  return (
    <div className="space-y-5 p-6">
      <PageHeader title="Audit log" subtitle="Who changed what, and when." />
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-52 flex-1 sm:max-w-sm"><Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" /><Input className="h-8 pl-8 text-xs" placeholder="Search action, resource, value…" value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <Select value={user} onValueChange={setUser}>
          <SelectTrigger className="h-8 w-44 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">All users</SelectItem>{users.map((u) => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      {isLoading && <TableSkeleton />}
      {error && <ErrorState message="Could not load the audit log" onRetry={() => void refetch()} />}
      {!isLoading && !error && rows.length === 0 && <EmptyState icon={ScrollText} title="No entries" body="No audit entries match your filters." />}
      {rows.length > 0 && (
        <div className="rounded-md border border-border bg-card">
          <Table>
            <TableHeader><TableRow><TableHead>When</TableHead><TableHead>User</TableHead><TableHead>Action</TableHead><TableHead>Resource</TableHead><TableHead>Old value</TableHead><TableHead>New value</TableHead></TableRow></TableHeader>
            <TableBody>
              {rows.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="whitespace-nowrap font-mono text-[11px] text-muted-foreground">{fmtDateTime(e.timestamp)}</TableCell>
                  <TableCell className="text-xs">{name(e.userId)}</TableCell>
                  <TableCell className="text-xs font-medium">{e.action}</TableCell>
                  <TableCell className="font-mono text-xs">{e.resource}</TableCell>
                  <TableCell className="max-w-48 truncate text-xs text-crimson/90">{e.oldValue ?? "—"}</TableCell>
                  <TableCell className="max-w-48 truncate text-xs text-success">{e.newValue ?? "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
