import { useEffect, useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { BarChart3 } from "lucide-react";
import { useAnalytics, useCases } from "@/hooks/queries";
import { EmptyState, ErrorState, PageHeader, Panel, Stat, TableSkeleton } from "@/components/common/Page";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fmtNum } from "@/utils/format";

const daily = { starts: { label: "Starts", color: "var(--info)" }, completions: { label: "Completions", color: "var(--success)" } } satisfies ChartConfig;
const single = (label: string, color: string) => ({ value: { label, color } }) satisfies ChartConfig;

const shortDate = (d: string) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });

function HBar({ data, keyName, valueName, label, color, percent }: { data: Array<Record<string, string | number>>; keyName: string; valueName: string; label: string; color: string; percent?: boolean }) {
  if (data.length === 0) return <p className="py-6 text-center text-xs text-muted-foreground">No data yet.</p>;
  return (
    <ChartContainer config={single(label, color)} className="w-full" style={{ height: Math.max(140, data.length * 34 + 20) }}>
      <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16 }}>
        <CartesianGrid horizontal={false} />
        <YAxis dataKey={keyName} type="category" tickLine={false} axisLine={false} width={110} tick={{ fontSize: 11 }} />
        <XAxis type="number" hide {...(percent ? { domain: [0, 100] as [number, number] } : {})} />
        <ChartTooltip cursor={false} content={<ChartTooltipContent formatter={(v) => (percent ? `${v}%` : fmtNum(Number(v)))} />} />
        <Bar dataKey={valueName} name={label} fill="var(--color-value)" radius={3} />
      </BarChart>
    </ChartContainer>
  );
}

export function AnalyticsPage() {
  const cases = useCases();
  const [caseId, setCaseId] = useState("");
  useEffect(() => { if (!caseId && cases.data?.length) setCaseId(cases.data.find((c) => c.status === "published")?.id ?? cases.data[0]!.id); }, [cases.data, caseId]);
  const a = useAnalytics(caseId);

  const funnel = a.data?.dropOff ?? [];
  const firstStep = funnel[0]?.players ?? 0;

  return (
    <div className="space-y-5 p-6">
      <PageHeader title="Analytics" subtitle="How players move through a case."
        actions={
          <Select value={caseId} onValueChange={setCaseId}>
            <SelectTrigger className="h-8 w-64 text-xs"><SelectValue placeholder="Select a case" /></SelectTrigger>
            <SelectContent>{cases.data?.map((c) => <SelectItem key={c.id} value={c.id} className="text-xs">{c.code} · {c.title}</SelectItem>)}</SelectContent>
          </Select>
        } />
      {(cases.isLoading || a.isLoading) && <TableSkeleton rows={4} />}
      {a.error && <ErrorState message="Could not load analytics" onRetry={() => void a.refetch()} />}
      {!caseId && !cases.isLoading && <EmptyState icon={BarChart3} title="No cases yet" body="Create a case to see its analytics." />}

      {a.data && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Stat label="Starts" value={fmtNum(a.data.starts)} />
            <Stat label="Completions" value={fmtNum(a.data.completions)} tone="success" />
            <Stat label="Completion rate" value={`${a.data.completionRate}%`} tone={a.data.completionRate < 50 ? "amber" : "success"} />
            <Stat label="Avg score" value={fmtNum(a.data.avgScore)} />
            <Stat label="Avg play time" value={`${a.data.avgPlayMinutes} min`} />
          </div>

          <Panel title="Starts and completions · last 30 days">
            <ChartContainer config={daily} className="h-64 w-full">
              <AreaChart data={a.data.daily} margin={{ left: 0, right: 8 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="date" tickFormatter={shortDate} tickLine={false} axisLine={false} minTickGap={24} />
                <YAxis tickLine={false} axisLine={false} width={40} />
                <ChartTooltip content={<ChartTooltipContent labelFormatter={(l) => shortDate(String(l))} />} />
                <Area dataKey="starts" type="monotone" stroke="var(--color-starts)" fill="var(--color-starts)" fillOpacity={0.15} />
                <Area dataKey="completions" type="monotone" stroke="var(--color-completions)" fill="var(--color-completions)" fillOpacity={0.25} />
              </AreaChart>
            </ChartContainer>
            <div className="mt-2 flex gap-4 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-info" />Starts</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-success" />Completions</span>
            </div>
          </Panel>

          <div className="grid gap-5 xl:grid-cols-2">
            <Panel title="Drop-off funnel">
              <HBar data={funnel.map((f) => ({ step: f.step, value: f.players }))} keyName="step" valueName="value" label="Players" color="var(--info)" />
              {funnel.length > 1 && firstStep > 0 && <p className="mt-2 text-[11px] text-muted-foreground">{Math.round(((firstStep - (funnel.at(-1)?.players ?? 0)) / firstStep) * 100)}% of players who start never reach the final step.</p>}
            </Panel>
            <Panel title="Evidence discovery rate">
              <HBar data={a.data.evidenceDiscovery.map((e) => ({ name: e.name, value: e.rate }))} keyName="name" valueName="value" label="Found by" color="var(--amber)" percent />
              {a.data.mostMissedClue && <p className="mt-2 text-[11px] text-muted-foreground">Most missed clue: <span className="text-foreground">{a.data.mostMissedClue}</span></p>}
            </Panel>
            <Panel title="Wrong accusations">
              <HBar data={a.data.wrongSuspects.map((w) => ({ name: w.name, value: w.count }))} keyName="name" valueName="value" label="Accusations" color="var(--crimson)" />
            </Panel>
            <Panel title="Hint usage">
              <HBar data={a.data.hintUsage.map((h) => ({ name: h.hint, value: h.uses }))} keyName="name" valueName="value" label="Uses" color="var(--violet)" />
            </Panel>
            <Panel title="Timeline mistakes" className="xl:col-span-2">
              <HBar data={a.data.timelineMistakes.map((t) => ({ name: t.event, value: t.mistakes }))} keyName="name" valueName="value" label="Mistakes" color="var(--crimson)" />
              {a.data.mostFailedInterview && <p className="mt-2 text-[11px] text-muted-foreground">Most failed interview: <span className="text-foreground">{a.data.mostFailedInterview}</span></p>}
            </Panel>
          </div>
        </>
      )}
    </div>
  );
}
