import { Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, Clock, MapPin, Tag, User } from "lucide-react";
import { useCaseDraft } from "../CaseDraftProvider";
import { Panel, Stat } from "@/components/common/Page";
import { CaseStatusBadge, DifficultyBadge, Pill } from "@/components/common/StatusBadge";
import { completeness } from "@/services/validation";
import { fmtDate, fmtDateTime, fmtNum } from "@/utils/format";
import { CASE_SECTIONS } from "@/constants/caseSections";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

export function CaseOverview() {
  const { bundle } = useCaseDraft();
  const c = bundle.case;
  const comp = completeness(bundle);
  const counts: Record<string, number> = {
    scenes: bundle.scenes.length, suspects: bundle.suspects.length, evidence: bundle.evidence.length, interviews: bundle.interviews.length,
    clues: bundle.clues.length, timeline: bundle.timeline.length, reveal: bundle.reveal.length,
  };
  return (
    <div className="grid gap-5 p-6 xl:grid-cols-[320px_1fr]">
      <div className="space-y-4">
        <div className="overflow-hidden rounded-md border border-border bg-card">
          <img src={c.coverImage} alt={c.title} className="aspect-[4/5] w-full object-cover" />
          <div className="space-y-2 p-4">
            <div className="flex items-center gap-2"><CaseStatusBadge status={c.status} /><span className="font-mono text-[11px] text-muted-foreground">v{c.version}</span></div>
            <h2 className="font-display text-xl font-semibold">{c.title}</h2>
            <p className="text-xs italic text-muted-foreground">{c.tagline}</p>
          </div>
        </div>
        <Panel title="Case file">
          <dl className="space-y-2 text-xs">
            {[
              [Tag, "Type", c.type], [Clock, "Play time", `${c.estimatedMinutes[0]}–${c.estimatedMinutes[1]} min`], [MapPin, "Location", c.location],
              [CalendarDays, "Incident", fmtDate(c.incidentDate)], [User, "Created by", c.createdBy],
            ].map(([Icon, k, v]) => {
              const I = Icon as typeof Tag;
              return <div key={k as string} className="flex items-center gap-2"><I className="size-3 text-muted-foreground" /><dt className="w-20 text-muted-foreground">{k as string}</dt><dd className="font-medium">{v as string}</dd></div>;
            })}
            <div className="flex items-center gap-2"><span className="size-3" /><dt className="w-20 text-muted-foreground">Difficulty</dt><dd><DifficultyBadge difficulty={c.difficulty} /></dd></div>
          </dl>
          <div className="mt-3 flex flex-wrap gap-1">{c.tags.map((t) => <Pill key={t}>{t}</Pill>)}</div>
        </Panel>
      </div>
      <div className="space-y-4">
        <Panel title="Story">
          <p className="text-sm leading-relaxed">{c.story}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-md border border-crimson/30 bg-crimson-soft p-3">
              <div className="label-caps text-crimson">Victim</div>
              <div className="mt-1 font-medium">{c.victim.name}, {c.victim.age}</div>
              <div className="text-xs text-muted-foreground">{c.victim.occupation} — {c.victim.description}</div>
            </div>
            <div className="rounded-md border border-border p-3">
              <div className="label-caps">Player must determine</div>
              <ul className="mt-1 space-y-0.5 text-xs">{c.objectives.map((o) => <li key={o}>— {o}</li>)}</ul>
            </div>
          </div>
        </Panel>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Stat label="Players" value={fmtNum(c.stats.players)} tone="info" />
          <Stat label="Completion" value={`${c.stats.completionRate}%`} />
          <Stat label="Avg score" value={c.stats.avgScore} tone="amber" />
          <Stat label="Rating" value={c.stats.rating ? `${c.stats.rating}★` : "—"} />
        </div>
        <Panel title="Build progress" actions={<span className="font-mono text-xs">{comp.percent}%</span>}>
          <Progress value={comp.percent} className="mb-4 h-1.5" />
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {CASE_SECTIONS.slice(1, 10).map((s) => (
              <Link key={s.key} to={s.to} params={{ caseId: c.id }} className="group flex items-center justify-between rounded-md border border-border px-3 py-2 text-xs hover:bg-accent">
                <span>{s.label}</span>
                <span className="flex items-center gap-2">
                  {counts[s.key] !== undefined && <span className={cn("font-mono", counts[s.key] ? "text-foreground" : "text-crimson")}>{counts[s.key]}</span>}
                  <ArrowRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
                </span>
              </Link>
            ))}
          </div>
        </Panel>
        <Panel title="Versions" bodyClassName="p-0">
          <table className="w-full text-xs">
            <tbody>
              {c.versions.map((v) => (
                <tr key={v.version} className="border-b border-border last:border-0">
                  <td className="px-4 py-2 font-mono">v{v.version}</td><td className="px-4 py-2">{v.summary}</td>
                  <td className="px-4 py-2 text-muted-foreground">{v.author}</td><td className="px-4 py-2 text-right text-muted-foreground">{fmtDateTime(v.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="flex justify-between border-t border-border px-4 py-2 text-[11px] text-muted-foreground"><span>Last modified {fmtDateTime(c.updatedAt)}</span><span>Published {fmtDateTime(c.publishedAt)}</span></div>
        </Panel>
      </div>
    </div>
  );
}
