import { useMemo, useState } from "react";
import { ReactFlow, Background, Controls, MiniMap, applyNodeChanges, type Node, type Edge, type NodeChange, type Connection } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Plus, Trash2 } from "lucide-react";
import { useCaseDraft, replaceById } from "@/features/cases/CaseDraftProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, Panel } from "@/components/common/Page";
import { uid } from "@/services/caseFactory";
import type { FlowNodeKind, InvestigationNode } from "@/types";

const KINDS: FlowNodeKind[] = ["start", "briefing", "scene", "evidence", "interview", "contradiction", "location", "timeline", "theory", "accusation", "reveal"];
const COLOR: Partial<Record<FlowNodeKind, string>> = { start: "var(--success)", evidence: "var(--amber)", interview: "var(--violet)", contradiction: "var(--crimson)", accusation: "var(--crimson)", reveal: "var(--success)", scene: "var(--info)" };

export function InvestigationFlowPage() {
  const { bundle, update } = useCaseDraft();
  const [sel, setSel] = useState<string | null>(null);
  const node = bundle.flowNodes.find((n) => n.id === sel);
  const saveNode = (n: InvestigationNode) => update((d) => ({ ...d, flowNodes: replaceById(d.flowNodes, n) }));

  const nodes: Node[] = useMemo(() => bundle.flowNodes.map((n) => ({
    id: n.id, position: n.position, selected: n.id === sel,
    data: { label: <div><div className="text-[9px] uppercase tracking-wider" style={{ color: COLOR[n.kind] ?? "var(--muted-foreground)" }}>{n.kind}{n.required ? " · required" : ""}</div><div className="text-[11px] font-medium">{n.label}</div></div> },
    style: { background: "var(--card)", color: "var(--foreground)", border: `1px solid ${COLOR[n.kind] ?? "var(--border)"}`, borderRadius: 8, width: 170, padding: 8 },
  })), [bundle.flowNodes, sel]);
  const edges: Edge[] = useMemo(() => bundle.flowEdges.map((e) => ({ id: e.id, source: e.source, target: e.target, label: e.label, animated: true, labelStyle: { fill: "var(--foreground)", fontSize: 10 }, labelBgStyle: { fill: "var(--card)" } })), [bundle.flowEdges]);

  const onNodesChange = (ch: NodeChange[]) => {
    const s = ch.find((c) => c.type === "select" && c.selected);
    if (s && "id" in s) setSel(s.id);
    if (ch.some((c) => c.type === "position")) {
      const moved = applyNodeChanges(ch, nodes);
      update((d) => ({ ...d, flowNodes: d.flowNodes.map((n) => ({ ...n, position: moved.find((m) => m.id === n.id)?.position ?? n.position })) }));
    }
  };
  const onConnect = (c: Connection) => c.source && c.target && update((d) => ({ ...d, flowEdges: [...d.flowEdges, { id: uid("fe"), source: c.source!, target: c.target! }] }));
  const add = () => { const n: InvestigationNode = { id: uid("fn"), kind: "evidence", label: "New step", required: false, position: { x: 100, y: 100 } }; update((d) => ({ ...d, flowNodes: [...d.flowNodes, n] })); setSel(n.id); };

  return (
    <div className="grid h-[calc(100vh-9rem)] grid-cols-[1fr_280px] gap-3 p-4">
      <div className="overflow-hidden rounded-lg border border-border bg-card/40">
        <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onConnect={onConnect} onEdgesDelete={(del) => update((d) => ({ ...d, flowEdges: d.flowEdges.filter((e) => !del.some((x) => x.id === e.id)) }))} onPaneClick={() => setSel(null)} fitView colorMode="dark">
          <Background /><Controls /><MiniMap pannable />
        </ReactFlow>
      </div>
      <Panel title={node ? "Step" : "Investigation flow"} actions={<Button size="sm" variant="secondary" onClick={add}><Plus className="size-3.5" />Step</Button>} bodyClassName="space-y-3 p-3">
        {node ? (
          <>
            <Field label="Label"><Input value={node.label} onChange={(e) => saveNode({ ...node, label: e.target.value })} /></Field>
            <Field label="Kind"><Select value={node.kind} onValueChange={(v) => saveNode({ ...node, kind: v as FlowNodeKind })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{KINDS.map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}</SelectContent></Select></Field>
            <label className="flex items-center justify-between text-xs">Required to solve <Switch checked={node.required} onCheckedChange={(v) => saveNode({ ...node, required: v })} /></label>
            <Button variant="destructive" size="sm" onClick={() => { update((d) => ({ ...d, flowNodes: d.flowNodes.filter((n) => n.id !== node.id), flowEdges: d.flowEdges.filter((e) => e.source !== node.id && e.target !== node.id) })); setSel(null); }}><Trash2 className="size-3.5" />Delete step</Button>
          </>
        ) : (
          <p className="text-xs text-muted-foreground">{bundle.flowNodes.length} steps, {bundle.flowEdges.length} connections. Select a step to edit it, drag between handles to connect steps.</p>
        )}
      </Panel>
    </div>
  );
}
