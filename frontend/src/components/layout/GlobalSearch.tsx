import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { searchAll, type SearchType } from "@/services/searchService";
import { Briefcase, FileText, Fingerprint, MapPin, MessagesSquare, Search, Lightbulb, User } from "lucide-react";
import { fmtAgo } from "@/utils/format";
import { CaseStatusBadge } from "@/components/common/StatusBadge";
import type { CaseStatus } from "@/types";
import { sectionPath } from "@/constants/caseSections";

const ICON: Record<SearchType, typeof Search> = { Case: Briefcase, Suspect: User, Evidence: Fingerprint, Interview: MessagesSquare, Clue: Lightbulb, Location: MapPin, Document: FileText };

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const { data = [] } = useQuery({ queryKey: ["search", q], queryFn: () => searchAll(q), enabled: open && q.length > 0 });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setOpen((o) => !o); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const groups = data.reduce<Record<string, typeof data>>((acc, r) => { (acc[r.type] ??= []).push(r); return acc; }, {});

  return (
    <>
      <button onClick={() => setOpen(true)} className="flex h-8 w-full max-w-sm items-center gap-2 rounded-md border border-border bg-background px-2.5 text-xs text-muted-foreground hover:bg-accent">
        <Search className="size-3.5" />
        <span className="flex-1 text-left">Search cases, suspects, evidence…</span>
        <kbd className="rounded border border-border bg-muted px-1.5 font-mono text-[10px]">Ctrl K</kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Search across all cases…" value={q} onValueChange={setQ} />
        <CommandList className="max-h-[420px]">
          <CommandEmpty>{q ? "No matches." : "Type to search cases, suspects, evidence, interviews, clues, locations and documents."}</CommandEmpty>
          {Object.entries(groups).map(([type, items]) => (
            <CommandGroup key={type} heading={type}>
              {items.map((r) => {
                const Icon = ICON[r.type];
                return (
                  <CommandItem key={`${r.caseId}-${r.id}`} value={`${r.name} ${r.caseCode} ${r.id}`} onSelect={() => { setOpen(false); navigate({ to: sectionPath(r.to), params: { caseId: r.caseId } }); }}>
                    <Icon className="size-3.5 text-muted-foreground" />
                    <span className="flex-1 truncate">{r.name}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{r.caseCode}</span>
                    <CaseStatusBadge status={r.status as CaseStatus} />
                    <span className="w-16 text-right text-[10px] text-muted-foreground">{fmtAgo(r.updatedAt)}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
