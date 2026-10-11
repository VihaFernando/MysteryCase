import type { Interview } from "@/types";
import { michaelEdges, michaelNodes, nuwanEdges, nuwanNodes, sarahEdges, sarahNodes } from "./dialogues";

export const demoInterviews: Interview[] = [
  { id: "int-sarah", code: "INT-001", title: "Sarah Fernando — Ex-partner", suspectId: "sus-sarah", locationId: "loc-apartment", description: "Sarah denies contact. Phone evidence exposes the 10:17 PM call and reveals Daniel's private matter.", unlockedByDefault: true, nodes: sarahNodes, edges: sarahEdges },
  { id: "int-michael", code: "INT-002", title: "Michael Perera — Business Partner", suspectId: "sus-michael", locationId: "loc-office", description: "Michael's 9:15 PM alibi collapses against the CCTV footage.", unlockedByDefault: true, nodes: michaelNodes, edges: michaelEdges },
  { id: "int-nuwan", code: "INT-003", title: "Nuwan Silva — Neighbor", suspectId: "sus-nuwan", locationId: "loc-entrance", description: "Nuwan's receipt proves he was home; he heard the argument.", unlockedByDefault: false, unlockCondition: { type: "group", id: "c-nu", operator: "AND", children: [{ type: "rule", id: "c-nu-1", kind: "evidence_discovered", targetId: "ev-004" }] }, nodes: nuwanNodes, edges: nuwanEdges },
];
