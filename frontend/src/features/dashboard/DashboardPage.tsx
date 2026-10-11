import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Activity, ArrowUpRight, Briefcase, Edit3, Globe, Image as ImageIcon, Plus, Send, Sparkles } from "lucide-react";
import { useActivity, useCases } from "@/hooks/queries";
import { PageHeader, Panel, Stat, TableSkeleton } from "@/components/common/Page";
import { CaseStatusBadge, DifficultyBadge } from "@/components/common/StatusBadge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { fmtAgo, fmtNum } from "@/utils/format";
import { Skeleton } from "@/components/ui/skeleton";
import type { ActivityItem, CaseStatus } from "@/types";
import { cn } from "@/lib/utils";

const PIPELINE: Array<{ key: CaseStatus; label: string; cls: string }> = [
  { key: "draft", label: "Draft", cls: "bg-muted-foreground" },
  { key: "review", label: "Review", cls: "bg-violet" },
  { key: "scheduled", label: "Scheduled", cls: "bg-info" },
  { key: "published", label: "Published", cls: "bg-success" },
];

const ACT_ICON: Record<ActivityItem["kind"], typeof Edit3> = { edit: Edit3, publish: Globe, media: ImageIcon, review: Send, create: Plus };

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export function DashboardPage() {
  const { data: cases, isLoading } = useCases();
  const { data: activity = [] } = useActivity();
  const [greet, setGreet] = useState("Good evening");
  useEffect(() => setGreet(greeting()), []);

  const list = cases ?? [];
  const totalPlayers = list.reduce((t, c) => t + c.stats.players, 0);
  const completions = list.reduce((t, c) => t + c.stats.completions, 0);
  const played = list.filter((c) => c.stats.players > 0);
  const avgScore = played.length ? Math.round(played.reduce((t, c) => t + c.stats.avgScore, 0) / played.length) : 0;
  const recent = [...list].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 6);
  const popular = [...list].filter((c) => c.stats.players > 0).sort((a, b) => b.stats.players - a.stats.players).slice(0, 3);

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        eyebrow="Workspace · MysteryCase Studio"
        title={`${greet}, Admin`}
        subtitle="Manage investigations, create new cases, and monitor your content pipeline."
        actions={<>
          <Button variant="outline" size="sm" asChild><Link to="/cases/$caseId/basic-info" params={{ caseId: "case-001" }}>Continue CASE-001</Link></Button>
          <Button size="sm" asChild><Link to="/cases/new"><Plus className="size-3.5" />New Case</Link></Button>
        </>}
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {isLoading ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[76px]" />) : <>
          <Stat label="Total Cases" value={list.length} sub={`${list.filter((c) => c.status === "review").length} in review`} />
          <Stat label="Published" value={list.filter((c) => c.status === "published").length} tone="success" sub="Live in app" />
          <Stat label="Drafts" value={list.filter((c) => c.status === "draft").length} sub="In authoring" />
          <Stat label="Players" value={fmtNum(totalPlayers)} tone="info" sub="+8.2% this week" />
          <Stat label="Cases Completed" value={fmtNum(completions)} sub={`${Math.round((completions / Math.max(1, totalPlayers)) * 100)}% completion`} />
          <Stat label="Average Score" value={avgScore} tone="amber" sub="out of 1000" />
        </>}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Case Pipeline" icon={Briefcase} className="xl:col-span-1">
          <div className="space-y-3">
            {PIPELINE.map((p) => {
              const items = list.filter((c) => c.status === p.key);
              return (
                <Link key={p.key} to="/cases" search={{ status: p.key }} className="block rounded-md border border-border p-3 hover:bg-accent">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-medium"><span className={cn("size-2 rounded-full", p.cls)} />{p.label}</span>
                    <span className="font-display text-lg font-semibold tabular">{items.length}</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {items.map((c) => <span key={c.id} className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{c.code}</span>)}
                    {items.length === 0 && <span className="text-[11px] text-muted-foreground">Empty</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        </Panel>

        <Panel title="Recent Cases" icon={Edit3} className="xl:col-span-2" bodyClassName="p-0" actions={<Link to="/cases" className="text-[11px] text-muted-foreground hover:text-foreground">View all</Link>}>
          {isLoading ? <div className="p-4"><TableSkeleton rows={5} /></div> : (
            <table className="w-full text-xs">
              <thead className="label-caps border-b border-border text-left">
                <tr>{["Case", "Type", "Difficulty", "Status", "Last Updated", "Completion", ""].map((h) => <th key={h} className="px-4 py-2 font-normal">{h}</th>)}</tr>
              </thead>
              <tbody>
                {recent.map((c) => (
                  <tr key={c.id} className="border-b border-border last:border-0 hover:bg-accent/50">
                    <td className="px-4 py-2">
                      <Link to="/cases/$caseId" params={{ caseId: c.id }} className="flex items-center gap-2.5">
                        <img src={c.coverImage} alt="" className="size-8 rounded-sm object-cover" loading="lazy" />
                        <span><span className="block font-mono text-[10px] text-muted-foreground">{c.code}</span><span className="font-medium">{c.title}</span></span>
                      </Link>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{c.type}</td>
                    <td className="px-4 py-2"><DifficultyBadge difficulty={c.difficulty} /></td>
                    <td className="px-4 py-2"><CaseStatusBadge status={c.status} /></td>
                    <td className="px-4 py-2 text-muted-foreground">{fmtAgo(c.updatedAt)}</td>
                    <td className="w-32 px-4 py-2">{c.stats.players ? <div className="flex items-center gap-2"><Progress value={c.stats.completionRate} className="h-1" /><span className="tabular">{c.stats.completionRate}%</span></div> : <span className="text-muted-foreground">—</span>}</td>
                    <td className="px-4 py-2 text-right"><Button variant="ghost" size="sm" asChild><Link to="/cases/$caseId/basic-info" params={{ caseId: c.id }}>Edit</Link></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Panel title="Popular Cases" icon={Sparkles} className="xl:col-span-2">
          <div className="grid gap-3 md:grid-cols-3">
            {popular.map((c) => (
              <Link key={c.id} to="/cases/$caseId" params={{ caseId: c.id }} className="group overflow-hidden rounded-md border border-border bg-background hover:border-amber/50">
                <div className="relative aspect-[16/10] overflow-hidden">
                  <img src={c.coverImage} alt={c.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-2.5">
                    <div className="font-mono text-[10px] text-white/70">{c.code}</div>
                    <div className="font-display text-sm font-semibold text-white">{c.title}</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 p-2.5 text-[11px]">
                  <div><div className="label-caps">Players</div><div className="tabular font-medium">{fmtNum(c.stats.players)}</div></div>
                  <div><div className="label-caps">Complete</div><div className="tabular font-medium">{c.stats.completionRate}%</div></div>
                  <div><div className="label-caps">Avg</div><div className="tabular font-medium text-amber">{c.stats.avgScore}</div></div>
                </div>
                <div className="flex items-center justify-between border-t border-border px-2.5 py-1.5"><DifficultyBadge difficulty={c.difficulty} /><ArrowUpRight className="size-3 text-muted-foreground" /></div>
              </Link>
            ))}
          </div>
        </Panel>
        <Panel title="Recent Activity" icon={Activity}>
          <ol className="relative space-y-3 border-l border-border pl-4">
            {activity.map((a) => {
              const Icon = ACT_ICON[a.kind];
              return (
                <li key={a.id} className="relative">
                  <span className="absolute -left-[23px] top-0.5 grid size-3.5 place-items-center rounded-full border border-border bg-card"><Icon className="size-2 text-muted-foreground" /></span>
                  <div className="text-xs"><span className="font-medium">{a.actor}</span> <span className="text-muted-foreground">{a.text}</span></div>
                  <div className="font-mono text-[10px] text-muted-foreground/70">{fmtAgo(a.at)}</div>
                </li>
              );
            })}
          </ol>
        </Panel>
      </div>
    </div>
  );
}
