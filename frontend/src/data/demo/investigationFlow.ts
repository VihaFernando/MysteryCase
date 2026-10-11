import type { InvestigationEdge, InvestigationNode } from "@/types";

const n = (id: string, kind: InvestigationNode["kind"], label: string, x: number, y: number, required = true, refId?: string): InvestigationNode => ({ id, kind, label, position: { x, y }, required, refId });

export const demoFlowNodes: InvestigationNode[] = [
  n("f-start", "start", "START", 320, 0),
  n("f-brief", "briefing", "Initial Briefing", 320, 90),
  n("f-living", "scene", "Living Room", 320, 180, true, "scn-living"),
  n("f-phone", "evidence", "Phone discovered", 120, 280, true, "ev-001"),
  n("f-kitchen", "scene", "Kitchen", 520, 280, false, "scn-kitchen"),
  n("f-sarah", "interview", "Sarah Interview unlocked", 120, 380, true, "int-sarah"),
  n("f-bedroom", "location", "Bedroom — Business Records", 120, 480, true, "loc-bedroom"),
  n("f-cctv", "evidence", "CCTV discovered", 520, 380, true, "ev-003"),
  n("f-michael", "contradiction", "Michael contradiction", 520, 480, true, "clue-004"),
  n("f-pharmacy", "location", "Pharmacy unlocked", 760, 380, false, "loc-pharmacy"),
  n("f-witness", "interview", "Witness interview", 760, 480, true, "int-nuwan"),
  n("f-parking", "location", "Parking Area", 760, 580, false, "loc-parking"),
  n("f-timeline", "timeline", "Timeline reconstruction", 320, 640),
  n("f-theory", "theory", "Theory creation", 320, 730),
  n("f-accuse", "accusation", "Final accusation", 320, 820),
  n("f-reveal", "reveal", "Reveal", 320, 910),
  n("f-dead", "location", "Michael's Office (dead end)", 900, 680, false, "loc-office"),
];

const e = (source: string, target: string, label?: string): InvestigationEdge => ({ id: `${source}-${target}`, source, target, label });

export const demoFlowEdges: InvestigationEdge[] = [
  e("f-start", "f-brief"), e("f-brief", "f-living"), e("f-living", "f-phone"), e("f-living", "f-kitchen"),
  e("f-phone", "f-sarah", "trg-1"), e("f-sarah", "f-bedroom", "trg-3"), e("f-living", "f-cctv"),
  e("f-cctv", "f-michael", "trg-2"), e("f-cctv", "f-pharmacy"), e("f-pharmacy", "f-witness", "trg-4"),
  e("f-michael", "f-parking", "trg-5"), e("f-witness", "f-timeline"), e("f-bedroom", "f-timeline"),
  e("f-michael", "f-timeline"), e("f-timeline", "f-theory"), e("f-theory", "f-accuse"), e("f-accuse", "f-reveal"),
  e("f-michael", "f-dead"),
];
