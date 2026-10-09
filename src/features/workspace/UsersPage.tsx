import { Check } from "lucide-react";
import { toast } from "sonner";
import { useRoles, useUserActions, useUsers } from "@/hooks/queries";
import { ErrorState, PageHeader, Panel, TableSkeleton } from "@/components/common/Page";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmtAgo, initials } from "@/utils/format";
import { cn } from "@/lib/utils";
import type { Permission } from "@/types";

const PERMISSIONS: Permission[] = ["cases.create", "cases.edit", "cases.delete", "cases.publish", "cases.review", "media.upload", "media.delete", "analytics.view", "users.manage", "settings.manage"];
const STATUS_CLS = { online: "bg-success", away: "bg-amber", offline: "bg-muted-foreground" } as const;

export function UsersPage() {
  const users = useUsers();
  const roles = useRoles();
  const { updateUser, updateRole } = useUserActions();
  const roleName = (id: string) => roles.data?.find((r) => r.id === id)?.name ?? id;

  if (users.isLoading || roles.isLoading) return <div className="p-6"><TableSkeleton /></div>;
  if (users.error || roles.error) return <div className="p-6"><ErrorState message="Could not load users" onRetry={() => { void users.refetch(); void roles.refetch(); }} /></div>;

  return (
    <div className="space-y-5 p-6">
      <PageHeader title="Users & roles" subtitle={`${users.data?.length ?? 0} team members · ${roles.data?.length ?? 0} roles`} />
      <Panel title="Team" bodyClassName="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>User</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Last active</TableHead></TableRow></TableHeader>
          <TableBody>
            {users.data?.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-7 place-items-center rounded-full text-[10px] font-medium text-white" style={{ background: u.avatarColor }}>{initials(u.name)}</span>
                    <div><div className="text-xs font-medium">{u.name}</div><div className="text-[11px] text-muted-foreground">{u.email}</div></div>
                  </div>
                </TableCell>
                <TableCell>
                  <Select value={u.roleId} onValueChange={(v) => updateUser.mutate({ ...u, roleId: v }, { onSuccess: () => toast.success(`${u.name} is now ${roleName(v)}`) })}>
                    <SelectTrigger className="h-7 w-44 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>{roles.data?.map((r) => <SelectItem key={r.id} value={r.id} className="text-xs">{r.name}</SelectItem>)}</SelectContent>
                  </Select>
                </TableCell>
                <TableCell><span className="flex items-center gap-1.5 text-xs capitalize"><span className={cn("size-2 rounded-full", STATUS_CLS[u.status])} />{u.status}</span></TableCell>
                <TableCell className="text-xs text-muted-foreground">{fmtAgo(u.lastActive)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
      <Panel title="Permission matrix" bodyClassName="overflow-x-auto p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Permission</TableHead>
              {roles.data?.map((r) => <TableHead key={r.id} className="text-center text-xs" title={r.description}>{r.name}</TableHead>)}
            </TableRow>
          </TableHeader>
          <TableBody>
            {PERMISSIONS.map((p) => (
              <TableRow key={p}>
                <TableCell className="font-mono text-xs">{p}</TableCell>
                {roles.data?.map((r) => {
                  const has = r.permissions.includes(p);
                  const locked = r.id === "role-super"; // the super admin role always keeps every permission
                  return (
                    <TableCell key={r.id} className="text-center">
                      <button disabled={locked} aria-label={`${r.name} ${p}: ${has ? "granted" : "not granted"}`} aria-pressed={has}
                        onClick={() => updateRole.mutate({ ...r, permissions: has ? r.permissions.filter((x) => x !== p) : [...r.permissions, p] })}
                        className={cn("grid size-6 place-items-center rounded-sm border", has ? "border-success/40 bg-success-soft text-success" : "border-border text-transparent hover:text-muted-foreground", locked && "cursor-not-allowed opacity-60")}>
                        <Check className="size-3.5" />
                      </button>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
    </div>
  );
}
