import { useMemo, useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ArrowDown, ArrowUp, ArrowUpRight, Search, type LucideIcon } from "lucide-react";
import { Clock, Fingerprint, MapPin, MessagesSquare, Search as SearchIcon, UserRound } from "lucide-react";
import type { UseQueryResult } from "@tanstack/react-query";
import { useAllClues, useAllEvidence, useAllInterviews, useAllLocations, useAllSuspects, useAllTimeline } from "@/hooks/queries";
import { EmptyState, ErrorState, PageHeader, TableSkeleton } from "@/components/common/Page";
import { Pill } from "@/components/common/StatusBadge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { sectionPath } from "@/constants/caseSections";
import { initials } from "@/utils/format";
import { cn } from "@/lib/utils";

interface CaseRef { id: string; caseId: string; caseCode: string; caseTitle: string }

interface Column<T> {
  header: string;
  cell: (row: T) => ReactNode;
  /** Present → the column is sortable by this value. */
  sort?: (row: T) => string | number;
  className?: string;
}

interface LibraryProps<T extends CaseRef> {
  title: string;
  noun: string;
  icon: LucideIcon;
  /** Case editor section the row links to. */
  section: string;
  query: UseQueryResult<T[]>;
  columns: Array<Column<T>>;
  searchText: (row: T) => string;
}

function Library<T extends CaseRef>({ title, noun, icon, section, query, columns, searchText }: LibraryProps<T>) {
  const [q, setQ] = useState("");
  const [caseId, setCaseId] = useState("all");
  const [sort, setSort] = useState<{ col: number; dir: 1 | -1 } | null>(null);
  const rows = useMemo(() => query.data ?? [], [query.data]);

  const cases = useMemo(() => [...new Map(rows.map((r) => [r.caseId, `${r.caseCode} · ${r.caseTitle}`])).entries()], [rows]);
  const visible = useMemo(() => {
    const filtered = rows.filter((r) => (caseId === "all" || r.caseId === caseId) && searchText(r).toLowerCase().includes(q.toLowerCase()));
    const col = sort ? columns[sort.col] : undefined;
    if (!sort || !col?.sort) return filtered;
    const get = col.sort;
    return [...filtered].sort((a, b) => {
      const x = get(a), y = get(b);
      return (typeof x === "number" && typeof y === "number" ? x - y : String(x).localeCompare(String(y))) * sort.dir;
    });
  }, [rows, caseId, q, sort, columns, searchText]);

  const toggleSort = (i: number) => setSort((s) => (s?.col === i ? (s.dir === 1 ? { col: i, dir: -1 } : null) : { col: i, dir: 1 }));

  return (
    <div className="space-y-5 p-6">
      <PageHeader title={title} subtitle={`${rows.length} ${noun} across ${cases.length} ${cases.length === 1 ? "case" : "cases"}`} />
      <div className="flex flex-wrap gap-2">
        <div className="relative min-w-52 flex-1 sm:max-w-sm">
          <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
          <Input className="h-8 pl-8 text-xs" placeholder={`Search ${noun}…`} value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Select value={caseId} onValueChange={setCaseId}>
          <SelectTrigger className="h-8 w-56 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-xs">All cases</SelectItem>
            {cases.map(([id, label]) => <SelectItem key={id} value={id} className="text-xs">{label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {query.isLoading && <TableSkeleton />}
      {query.error && <ErrorState message={`Could not load ${noun}`} onRetry={() => void query.refetch()} />}
      {!query.isLoading && !query.error && visible.length === 0 && <EmptyState icon={icon} title={`No ${noun} found`} body={rows.length ? "Try a different search or case filter." : "Items you create inside cases appear here."} />}
      {visible.length > 0 && (
        <div className="rounded-md border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((c, i) => (
                  <TableHead key={c.header} className={c.className}>
                    {c.sort ? (
                      <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort(i)}>
                        {c.header}{sort?.col === i && (sort.dir === 1 ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />)}
                      </button>
                    ) : c.header}
                  </TableHead>
                ))}
                <TableHead>Case</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((r) => (
                <TableRow key={`${r.caseId}-${r.id}`}>
                  {columns.map((c) => <TableCell key={c.header} className={cn("text-xs", c.className)}>{c.cell(r)}</TableCell>)}
                  <TableCell><span className="font-mono text-[11px] text-muted-foreground" title={r.caseTitle}>{r.caseCode}</span></TableCell>
                  <TableCell>
                    <Link to={sectionPath(section)} params={{ caseId: r.caseId }} className="text-muted-foreground hover:text-foreground" aria-label={`Open in ${r.caseCode}`}><ArrowUpRight className="size-4" /></Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

const yes = (v: boolean, label: string, tone: "crimson" | "amber" | "success" | "info" | "neutral" = "neutral") => (v ? <Pill tone={tone}>{label}</Pill> : null);

export function SuspectsLibrary() {
  const query = useAllSuspects();
  return (
    <Library title="Suspects & characters" noun="characters" icon={UserRound} section="suspects" query={query}
      searchText={(s) => `${s.name} ${s.occupation} ${s.role} ${s.relationship}`}
      columns={[
        { header: "Name", sort: (s) => s.name, cell: (s) => (
          <div className="flex items-center gap-2">
            {s.portrait ? <img src={s.portrait} alt="" className="size-8 rounded-sm object-cover" loading="lazy" /> : <span className="grid size-8 place-items-center rounded-sm bg-muted font-mono text-[10px]">{initials(s.name)}</span>}
            <span className="font-medium">{s.name}</span>
          </div>
        ) },
        { header: "Role", sort: (s) => s.role, cell: (s) => <span className="capitalize">{s.role}</span> },
        { header: "Occupation", sort: (s) => s.occupation, cell: (s) => s.occupation || "—" },
        { header: "Flags", cell: (s) => <div className="flex gap-1">{yes(s.isKiller, "Killer", "crimson")}{yes(s.isRedHerring, "Red herring", "amber")}</div> },
      ]} />
  );
}

export function LocationsLibrary() {
  const query = useAllLocations();
  return (
    <Library title="Locations" noun="locations" icon={MapPin} section="scenes" query={query}
      searchText={(l) => `${l.name} ${l.address} ${l.description}`}
      columns={[
        { header: "Name", sort: (l) => l.name, cell: (l) => <span className="font-medium">{l.name}</span> },
        { header: "Address", sort: (l) => l.address, cell: (l) => l.address || "—" },
        { header: "Access", sort: (l) => Number(l.unlockedByDefault), cell: (l) => (l.unlockedByDefault ? <Pill tone="success">Open</Pill> : <Pill tone="amber">Locked</Pill>) },
      ]} />
  );
}

export function EvidenceLibrary() {
  const query = useAllEvidence();
  return (
    <Library title="Evidence" noun="evidence items" icon={Fingerprint} section="evidence" query={query}
      searchText={(e) => `${e.code} ${e.name} ${e.type} ${e.description}`}
      columns={[
        { header: "Item", sort: (e) => e.code, cell: (e) => (
          <div className="flex items-center gap-2">
            {e.image ? <img src={e.image} alt="" className="size-8 rounded-sm object-cover" loading="lazy" /> : <span className="size-8 rounded-sm bg-muted" />}
            <div><div className="font-medium">{e.name}</div><div className="font-mono text-[10px] text-muted-foreground">{e.code}</div></div>
          </div>
        ) },
        { header: "Type", sort: (e) => e.type, cell: (e) => <span className="capitalize">{String(e.type).replace(/_/g, " ")}</span> },
        { header: "Stages", sort: (e) => e.inspections.length, cell: (e) => e.inspections.length, className: "text-right" },
        { header: "Flags", cell: (e) => <div className="flex gap-1">{yes(e.isKey, "Key", "info")}{yes(e.isRedHerring, "Red herring", "amber")}</div> },
      ]} />
  );
}

export function InterviewsLibrary() {
  const query = useAllInterviews();
  return (
    <Library title="Interviews" noun="interviews" icon={MessagesSquare} section="interviews" query={query}
      searchText={(i) => `${i.code} ${i.title} ${i.description}`}
      columns={[
        { header: "Interview", sort: (i) => i.code, cell: (i) => <div><div className="font-medium">{i.title}</div><div className="font-mono text-[10px] text-muted-foreground">{i.code}</div></div> },
        { header: "Nodes", sort: (i) => i.nodes.length, cell: (i) => i.nodes.length, className: "text-right" },
        { header: "Paths", sort: (i) => i.edges.length, cell: (i) => i.edges.length, className: "text-right" },
        { header: "Access", sort: (i) => Number(i.unlockedByDefault), cell: (i) => (i.unlockedByDefault ? <Pill tone="success">Open</Pill> : <Pill tone="amber">Gated</Pill>) },
      ]} />
  );
}

export function CluesLibrary() {
  const query = useAllClues();
  return (
    <Library title="Clues" noun="clues" icon={SearchIcon} section="clues" query={query}
      searchText={(c) => `${c.code} ${c.title} ${c.description} ${c.category}`}
      columns={[
        { header: "Clue", sort: (c) => c.code, cell: (c) => <div><div className="font-medium">{c.title}</div><div className="font-mono text-[10px] text-muted-foreground">{c.code}</div></div> },
        { header: "Category", sort: (c) => c.category, cell: (c) => <Pill tone="info">{c.category.replace("_", " ")}</Pill> },
        { header: "Importance", sort: (c) => ({ critical: 0, major: 1, minor: 2 })[c.importance], cell: (c) => <Pill tone={c.importance === "critical" ? "crimson" : c.importance === "major" ? "amber" : "neutral"}>{c.importance}</Pill> },
        { header: "Flags", cell: (c) => yes(c.isRedHerring, "Red herring", "amber") },
      ]} />
  );
}

export function TimelinesLibrary() {
  const query = useAllTimeline();
  return (
    <Library title="Timeline events" noun="events" icon={Clock} section="timeline" query={query}
      searchText={(t) => `${t.time} ${t.title} ${t.description} ${t.source}`}
      columns={[
        { header: "Time", sort: (t) => t.time, cell: (t) => <span className="font-mono text-amber">{t.time || "--:--"}</span> },
        { header: "Event", sort: (t) => t.title, cell: (t) => <span className="font-medium">{t.title}</span> },
        { header: "Source", sort: (t) => t.source, cell: (t) => t.source || "—" },
        { header: "Visibility", sort: (t) => t.visibility, cell: (t) => <span className="capitalize">{t.visibility}</span> },
        { header: "Kind", cell: (t) => (t.isClaim ? <Pill tone={t.isTrue ? "violet" : "crimson"}>{t.isTrue ? "Claim · true" : "Claim · false"}</Pill> : <Pill>Fact</Pill>) },
      ]} />
  );
}
