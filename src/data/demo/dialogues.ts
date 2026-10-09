import type { DialogueEdge, DialogueNode } from "@/types";

const e = (source: string, target: string, label?: string): DialogueEdge => ({ id: `${source}->${target}`, source, target, label });

const hasPhone = { type: "group" as const, id: "cond-phone", operator: "AND" as const, children: [{ type: "rule" as const, id: "cond-phone-1", kind: "evidence_discovered" as const, targetId: "ev-001" }] };
const hasCctv = { type: "group" as const, id: "cond-cctv", operator: "AND" as const, children: [{ type: "rule" as const, id: "cond-cctv-1", kind: "evidence_discovered" as const, targetId: "ev-003" }] };

export const sarahNodes: DialogueNode[] = [
  { id: "s-start", type: "start", text: "Interview begins — Sarah Fernando, Cinnamon Gardens police station.", position: { x: 380, y: 0 } },
  { id: "s-open", type: "response", speaker: "Sarah", text: "I've already told the police everything. I was home that night.", position: { x: 380, y: 110 }, reaction: { emotion: "defensive", intensity: 1 } },
  { id: "s-menu", type: "choice", text: "Choose a question", position: { x: 380, y: 230 } },
  { id: "s-q1", type: "question", speaker: "Detective", text: "Where were you at 10 PM?", position: { x: 0, y: 360 } },
  { id: "s-a1", type: "response", speaker: "Sarah", text: "At home in Rajagiriya. Watching a series. Alone.", position: { x: 0, y: 470 }, reaction: { emotion: "calm", intensity: 1 } },
  { id: "s-q2", type: "question", speaker: "Detective", text: "What was your relationship with Daniel?", position: { x: 250, y: 360 } },
  { id: "s-a2", type: "response", speaker: "Sarah", text: "We dated for two years. It ended three months ago. We were still… civil.", position: { x: 250, y: 470 }, reaction: { emotion: "sad", intensity: 2 }, clueId: "clue-013" },
  { id: "s-q3", type: "question", speaker: "Detective", text: "When did you last speak to Daniel?", position: { x: 500, y: 360 } },
  { id: "s-a3", type: "response", speaker: "Sarah", text: "Last week, maybe. I don't remember exactly.", position: { x: 500, y: 470 }, reaction: { emotion: "nervous", intensity: 2 }, isContradiction: true },
  { id: "s-q4", type: "question", speaker: "Detective", text: "Did you call Daniel at 10:17 PM?", position: { x: 760, y: 360 }, condition: hasPhone },
  { id: "s-a4", type: "response", speaker: "Sarah", text: "No. Why would I call him that late?", position: { x: 760, y: 470 }, reaction: { emotion: "defensive", intensity: 2 } },
  { id: "s-present", type: "present_evidence", text: "Present: Daniel's Phone — call log 10:17 PM, 43 seconds", evidenceId: "ev-001", position: { x: 760, y: 590 }, condition: hasPhone },
  { id: "s-react", type: "reaction", speaker: "Sarah", text: "...Fine. I did call him.", position: { x: 760, y: 710 }, reaction: { emotion: "relieved", intensity: 3 } },
  { id: "s-clue", type: "clue", text: "Clue: Sarah lied about the 10:17 PM call", clueId: "clue-002", position: { x: 560, y: 830 } },
  { id: "s-q5", type: "question", speaker: "Detective", text: "Why did you call him?", position: { x: 960, y: 830 } },
  { id: "s-a5", type: "response", speaker: "Sarah", text: "He sounded scared at dinner. He said Michael had been taking money. I gave him the bank statements at 7:30. I called to check he was okay — he said 'Michael is here' and hung up.", position: { x: 960, y: 950 }, reaction: { emotion: "sad", intensity: 3 } },
  { id: "s-unlock", type: "unlock", text: "Unlock: Sarah met Daniel earlier that evening + Michael interview Q: 'Were you there at 10:17?'", unlockTargetId: "m-q4", position: { x: 960, y: 1070 } },
  { id: "s-end", type: "end", text: "Interview complete", position: { x: 380, y: 1190 } },
];

export const sarahEdges: DialogueEdge[] = [
  e("s-start", "s-open"), e("s-open", "s-menu"),
  e("s-menu", "s-q1", "Alibi"), e("s-menu", "s-q2", "Relationship"), e("s-menu", "s-q3", "Last contact"), e("s-menu", "s-q4", "10:17 call (needs phone)"),
  e("s-q1", "s-a1"), e("s-q2", "s-a2"), e("s-q3", "s-a3"), e("s-q4", "s-a4"),
  e("s-a1", "s-end"), e("s-a2", "s-end"), e("s-a3", "s-end"),
  e("s-a4", "s-present", "Present evidence"), e("s-present", "s-react"),
  e("s-react", "s-clue"), e("s-react", "s-q5"), e("s-q5", "s-a5"), e("s-a5", "s-unlock"), e("s-unlock", "s-end"), e("s-clue", "s-end"),
];

export const michaelNodes: DialogueNode[] = [
  { id: "m-start", type: "start", text: "Interview begins — Michael Perera.", position: { x: 300, y: 0 } },
  { id: "m-open", type: "response", speaker: "Michael", text: "Terrible business. Daniel was like a brother. Ask whatever you need.", position: { x: 300, y: 110 }, reaction: { emotion: "calm", intensity: 1 } },
  { id: "m-menu", type: "choice", text: "Choose a question", position: { x: 300, y: 230 } },
  { id: "m-q1", type: "question", speaker: "Detective", text: "When did you leave Daniel's apartment?", position: { x: 0, y: 360 } },
  { id: "m-a1", type: "response", speaker: "Michael", text: "9:15 sharp. I drove to the office to finish the quarterly report.", position: { x: 0, y: 470 }, clueId: "clue-005" },
  { id: "m-q2", type: "question", speaker: "Detective", text: "How was the business doing?", position: { x: 300, y: 360 } },
  { id: "m-a2", type: "response", speaker: "Michael", text: "Never better. Daniel worried too much about the numbers.", position: { x: 300, y: 470 }, reaction: { emotion: "nervous", intensity: 1 } },
  { id: "m-q4", type: "question", speaker: "Detective", text: "Were you with Daniel at 10:17 PM?", position: { x: 600, y: 360 }, condition: { type: "group", id: "cond-sarah", operator: "AND", children: [{ type: "rule", id: "cond-sarah-1", kind: "clue_discovered", targetId: "clue-002" }] } },
  { id: "m-present", type: "present_evidence", text: "Present: Building CCTV — 9:42 PM re-entry", evidenceId: "ev-003", position: { x: 600, y: 470 }, condition: hasCctv },
  { id: "m-react", type: "reaction", speaker: "Michael", text: "That could be anyone. ...Alright. I went back for my laptop charger. He was alive when I left.", position: { x: 600, y: 590 }, reaction: { emotion: "angry", intensity: 3 }, isContradiction: true },
  { id: "m-clue", type: "clue", text: "Clue: Michael's alibi broken", clueId: "clue-004", position: { x: 600, y: 710 } },
  { id: "m-unlock", type: "unlock", text: "Unlock: Parking Area", unlockTargetId: "loc-parking", position: { x: 600, y: 820 } },
  { id: "m-end", type: "end", text: "Interview complete", position: { x: 300, y: 940 } },
];

export const michaelEdges: DialogueEdge[] = [
  e("m-start", "m-open"), e("m-open", "m-menu"),
  e("m-menu", "m-q1", "Alibi"), e("m-menu", "m-q2", "Business"), e("m-menu", "m-q4", "10:17 (needs Sarah clue)"),
  e("m-q1", "m-a1"), e("m-q2", "m-a2"), e("m-q4", "m-present", "Present CCTV"),
  e("m-present", "m-react"), e("m-react", "m-clue"), e("m-clue", "m-unlock"),
  e("m-a1", "m-end"), e("m-a2", "m-end"), e("m-unlock", "m-end"),
];

export const nuwanNodes: DialogueNode[] = [
  { id: "n-start", type: "start", text: "Interview begins — Nuwan Silva, Apt 7C.", position: { x: 200, y: 0 } },
  { id: "n-open", type: "response", speaker: "Nuwan", text: "I was out working, sir. Deliveries all night.", position: { x: 200, y: 110 }, reaction: { emotion: "nervous", intensity: 2 } },
  { id: "n-present", type: "present_evidence", text: "Present: Pharmacy Receipt — 10:04 PM", evidenceId: "ev-004", position: { x: 200, y: 230 } },
  { id: "n-react", type: "reaction", speaker: "Nuwan", text: "Okay, okay. I came home at ten for a headache. I heard them. Shouting about money, around 10:21.", position: { x: 200, y: 350 }, reaction: { emotion: "relieved", intensity: 2 } },
  { id: "n-clue", type: "clue", text: "Clue: Argument at 10:21 PM", clueId: "clue-011", position: { x: 0, y: 470 } },
  { id: "n-q1", type: "question", speaker: "Detective", text: "Did you see anyone leave?", position: { x: 400, y: 470 } },
  { id: "n-a1", type: "response", speaker: "Nuwan", text: "A man in a dark jacket, down the parking stairs. Maybe 10:30.", position: { x: 400, y: 580 } },
  { id: "n-end", type: "end", text: "Interview complete", position: { x: 200, y: 700 } },
];

export const nuwanEdges: DialogueEdge[] = [
  e("n-start", "n-open"), e("n-open", "n-present", "Present receipt"), e("n-present", "n-react"),
  e("n-react", "n-clue"), e("n-react", "n-q1"), e("n-q1", "n-a1"), e("n-a1", "n-end"), e("n-clue", "n-end"),
];
