import { useMemo, useState } from "react";
import { ReactFlow, Background, Controls, MiniMap, type Node, type Edge, type Connection, type NodeChange, applyNodeChanges } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { MessagesSquare, Plus, Trash2 } from "lucide-react";
import { useCaseDraft, replaceById } from "@/features/cases/CaseDraftProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Field, EmptyState, Panel } from "@/components/common/Page";
import { Pill } from "@/components/common/StatusBadge";
import { uid } from "@/services/caseFactory";
import type { DialogueNode, DialogueNodeType, Interview } from "@/types";

const TYPES: DialogueNodeType[] = ["start", "question", "response", "choice", "present_evidence", "reaction", "clue", "unlock", "end"];
const COLOR: Record<DialogueNodeType, string> = {
  start: "var(--success)", question: "var(--info)", response: "var(--muted-foreground)", choice: "var(--violet)",
  present_evidence: "var(--amber)", reaction: "var(--crimson)", clue: "var(--amber)", unlock: "var(--success)", end: "var(--crimson)",
};

export function InterviewBuilder() {
  const { bundle, update } = useCaseDraft();
  const [ivId, setIvId] = useState(bundle.interviews[0]?.id ?? "");
  const [sel, setSel] = useState<string | null>(null);
  const iv = bundle.interviews.find((i) => i.id === ivId);
  const node = iv?.nodes.find((n) => n.id === sel);

  const save = (next: Interview) => update((d) => ({ ...d, interviews: replaceById(d.interviews, next) }));
  const saveNode = (n: DialogueNode) => iv && save({ ...iv, nodes: replaceById(iv.nodes, n) });

  const nodes: Node[] = useMemo(() => (iv?.nodes ?? []).map((n) => ({
    id: n.id, position: n.position, selected: n.id === sel,
    data: { label: <div className="text-left"><div className="text-[9px] font-semibold uppercase tracking-wider" style={{ color: COLOR[n.type] }}>{n.type.replace("_", " ")}{n.isContradiction ? " · contradiction" : ""}</div><div className="line-clamp-2 text-[11px]">{n.speaker ? `${n.speaker}: ` : ""}{n.text || "…"}</div></div> },
    style: { background: "var(--card)", color: "var(--foreground)", border: `1px solid ${COLOR[n.type]}`, borderRadius: 8, width: 200, padding: 8 },
  })), [iv, sel]);
  const edges: Edge[] = useMemo(() => (iv?.edges ?? []).map((e) => ({ id: e.id, source: e.source, target: e.target, label: e.label, animated: true, style: { stroke: "var(--muted-foreground)" }, labelStyle: { fill: "var(--foreground)", fontSize: 10 }, labelBgStyle: { fill: "var(--card)" } })), [iv]);

  if (!iv) return <div className="p-6"><EmptyState icon={MessagesSquare} title="No interviews yet" action={<Button onClick={() => addInterview()}><Plus className="size-3.5" />New interview</Button>} /></div>;

  function addInterview() {
    const id = uid("iv");
    const start: DialogueNode = { id: uid("dn"), type: "start", text: "Interview begins", position: { x: 0, y: 0 } };
    update((d) => ({ ...d, interviews: [...d.interviews, { id, code: `INT-${String(d.interviews.length + 1).padStart(3, "0")}`, title: "New interview", suspectId: d.suspects[0]?.id ?? "", description: "", unlockedByDefault: true, nodes: [start], edges: [] }] }));
    setIvId(id);
  }
  const onNodesChange = (ch: NodeChange[]) => {
    const moved = applyNodeChanges(ch, nodes);
    const sel = ch.find((c) => c.type === "select" && c.selected);
    if (sel && "id" in sel) setSel(sel.id);
    if (ch.some((c) => c.type === "position" && !c.dragging)) save({ ...iv, nodes: iv.nodes.map((n) => ({ ...n, position: moved.find((m) => m.id === n.id)?.position ?? n.position })) });
    else if (ch.some((c) => c.type === "position")) save({ ...iv, nodes: iv.nodes.map((n) => ({ ...n, position: moved.find((m) => m.id === n.id)?.position ?? n.position })) });
  };
  const onConnect = (c: Connection) => c.source && c.target && save({ ...iv, edges: [...iv.edges, { id: uid("de"), source: c.source, target: c.target }] });
  const addNode = (type: DialogueNodeType) => {
    const n: DialogueNode = { id: uid("dn"), type, text: "", position: { x: (node?.position.x ?? 0) + 40, y: (node?.position.y ?? 0) + 140 } };
    save({ ...iv, nodes: [...iv.nodes, n], edges: node ? [...iv.edges, { id: uid("de"), source: node.id, target: n.id }] : iv.edges });
    setSel(n.id);
  };
  const delNode = () => { if (!node) return; save({ ...iv, nodes: iv.nodes.filter((n) => n.id !== node.id), edges: iv.edges.filter((e) => e.source !== node.id && e.target !== node.id) }); setSel(null); };
  const suspectName = (id: string) => bundle.suspects.find((s) => s.id === id)?.name ?? "—";

  return (
    <div className="grid h-[calc(100vh-9rem)] grid-cols-[240px_1fr_300px] gap-3 p-4">
      <Panel title="Interviews" actions={<Button size="icon" variant="ghost" className="size-7" onClick={addInterview}><Plus className="size-3.5" /></Button>} bodyClassName="p-2 space-y-1">
        {bundle.interviews.map((i) => (
          <button key={i.id} onClick={() => { setIvId(i.id); setSel(null); }} className={`w-full rounded-md px-2 py-2 text-left text-xs ${i.id === ivId ? "bg-accent" : "hover:bg-accent/50"}`}>
            <div className="font-mono text-[10px] text-muted-foreground">{i.code}</div>
            <div className="font-medium">{i.title}</div>
            <div className="text-[10px] text-muted-foreground">{suspectName(i.suspectId)} · {i.nodes.length} nodes</div>
          </button>
        ))}
      </Panel>
      <div className="relative overflow-hidden rounded-lg border border-border bg-card/40">
        <div className="absolute left-2 top-2 z-10 flex flex-wrap gap-1">
          {TYPES.filter((t) => t !== "start").map((t) => <Button key={t} size="sm" variant="secondary" className="h-6 px-2 text-[10px] capitalize" onClick={() => addNode(t)}>+ {t.replace("_", " ")}</Button>)}
        </div>
        <ReactFlow nodes={nodes} edges={edges} onNodesChange={onNodesChange} onConnect={onConnect} onEdgesDelete={(del) => save({ ...iv, edges: iv.edges.filter((e) => !del.some((d) => d.id === e.id)) })} onPaneClick={() => setSel(null)} fitView colorMode="dark">
          <Background /><Controls /><MiniMap pannable />
        </ReactFlow>
      </div>
      <Panel title={node ? "Dialogue node" : "Interview settings"} bodyClassName="space-y-3 p-3 overflow-y-auto">
        {node ? (
          <>
            <Field label="Type"><Select value={node.type} onValueChange={(v) => saveNode({ ...node, type: v as DialogueNodeType })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Speaker"><Input value={node.speaker ?? ""} onChange={(e) => saveNode({ ...node, speaker: e.target.value })} /></Field>
            <Field label="Text"><Textarea rows={4} value={node.text} onChange={(e) => saveNode({ ...node, text: e.target.value })} /></Field>
            {(node.type === "present_evidence" || node.type === "reaction") && (
              <Field label="Evidence"><Select value={node.evidenceId ?? ""} onValueChange={(v) => saveNode({ ...node, evidenceId: v })}><SelectTrigger><SelectValue placeholder="Select evidence" /></SelectTrigger><SelectContent>{bundle.evidence.map((e) => <SelectItem key={e.id} value={e.id}>{e.code} {e.name}</SelectItem>)}</SelectContent></Select></Field>
            )}
            {node.type === "clue" && (
              <Field label="Unlocks clue"><Select value={node.clueId ?? ""} onValueChange={(v) => saveNode({ ...node, clueId: v })}><SelectTrigger><SelectValue placeholder="Select clue" /></SelectTrigger><SelectContent>{bundle.clues.map((c) => <SelectItem key={c.id} value={c.id}>{c.code} {c.title}</SelectItem>)}</SelectContent></Select></Field>
            )}
            {node.type === "reaction" && (
              <Field label="Emotion"><Select value={node.reaction?.emotion ?? "calm"} onValueChange={(v) => saveNode({ ...node, reaction: { emotion: v as NonNullable<DialogueNode["reaction"]>["emotion"], intensity: node.reaction?.intensity ?? 2 } })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["calm", "nervous", "defensive", "angry", "sad", "relieved"].map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}</SelectContent></Select></Field>
            )}
            <label className="flex items-center justify-between text-xs">Marks contradiction <Switch checked={!!node.isContradiction} onCheckedChange={(v) => saveNode({ ...node, isContradiction: v })} /></label>
            <div className="text-[11px] text-muted-foreground">Drag from a node handle to connect. Select an edge and press Backspace to remove it.</div>
            {node.type !== "start" && <Button variant="destructive" size="sm" onClick={delNode}><Trash2 className="size-3.5" />Delete node</Button>}
          </>
        ) : (
          <>
            <Field label="Code"><Input className="font-mono" value={iv.code} onChange={(e) => save({ ...iv, code: e.target.value })} /></Field>
            <Field label="Title"><Input value={iv.title} onChange={(e) => save({ ...iv, title: e.target.value })} /></Field>
            <Field label="Suspect"><Select value={iv.suspectId} onValueChange={(v) => save({ ...iv, suspectId: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{bundle.suspects.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent></Select></Field>
            <Field label="Description"><Textarea rows={3} value={iv.description} onChange={(e) => save({ ...iv, description: e.target.value })} /></Field>
            <label className="flex items-center justify-between text-xs">Unlocked by default <Switch checked={iv.unlockedByDefault} onCheckedChange={(v) => save({ ...iv, unlockedByDefault: v })} /></label>
            <div className="flex flex-wrap gap-1"><Pill>{iv.nodes.length} nodes</Pill><Pill>{iv.edges.length} links</Pill><Pill tone="crimson">{iv.nodes.filter((n) => n.isContradiction).length} contradictions</Pill></div>
            <Button variant="destructive" size="sm" onClick={() => { update((d) => ({ ...d, interviews: d.interviews.filter((x) => x.id !== iv.id) })); setIvId(bundle.interviews.find((x) => x.id !== iv.id)?.id ?? ""); }}><Trash2 className="size-3.5" />Delete interview</Button>
          </>
        )}
      </Panel>
    </div>
  );
}
