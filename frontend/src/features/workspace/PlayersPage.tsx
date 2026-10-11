import { Trophy } from "lucide-react";
import { useAchievements, usePlayers } from "@/hooks/queries";
import { ErrorState, PageHeader, Panel, TableSkeleton } from "@/components/common/Page";
import { Pill, type Tone } from "@/components/common/StatusBadge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fmtAgo, fmtNum } from "@/utils/format";
import type { Achievement } from "@/types";

const RARITY: Record<Achievement["rarity"], Tone> = { common: "neutral", rare: "info", epic: "violet", legendary: "amber" };

export function PlayersPage() {
  const players = usePlayers();
  const achievements = useAchievements();
  if (players.isLoading) return <div className="p-6"><TableSkeleton /></div>;
  if (players.error) return <div className="p-6"><ErrorState message="Could not load players" onRetry={() => void players.refetch()} /></div>;

  return (
    <div className="space-y-5 p-6">
      <PageHeader title="Players" subtitle={`${players.data?.length ?? 0} players tracked`} />
      <Panel title="Leaderboard" bodyClassName="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Player</TableHead><TableHead>Rank</TableHead><TableHead className="text-right">Cases</TableHead><TableHead className="text-right">Avg score</TableHead><TableHead className="text-right">Play time</TableHead><TableHead>Platform</TableHead><TableHead>Last active</TableHead></TableRow></TableHeader>
          <TableBody>
            {players.data?.map((p) => (
              <TableRow key={p.playerId}>
                <TableCell className="text-xs font-medium">{p.name}</TableCell>
                <TableCell><Pill tone="amber">{p.rank}</Pill></TableCell>
                <TableCell className="text-right font-mono text-xs">{fmtNum(p.casesCompleted)}</TableCell>
                <TableCell className="text-right font-mono text-xs">{fmtNum(p.avgScore)}</TableCell>
                <TableCell className="text-right font-mono text-xs">{Math.floor(p.totalMinutes / 60)}h {p.totalMinutes % 60}m</TableCell>
                <TableCell className="text-xs capitalize">{p.platform}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{fmtAgo(p.lastActive)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Panel>
      <Panel title="Achievements" icon={Trophy}>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {achievements.data?.map((a) => (
            <div key={a.id} className="rounded-md border border-border bg-background p-3">
              <div className="flex items-center justify-between gap-2"><span className="text-sm font-medium">{a.name}</span><Pill tone={RARITY[a.rarity]}>{a.rarity}</Pill></div>
              <p className="mt-1 text-xs text-muted-foreground">{a.description}</p>
              <div className="mt-2 font-mono text-[11px] text-muted-foreground">{fmtNum(a.unlockedBy)} players unlocked</div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
