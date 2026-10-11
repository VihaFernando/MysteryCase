import type { DialogueEdge, DialogueNode } from "@/types";

const e = (source: string, target: string, label?: string): DialogueEdge => ({ id: `${source}->${target}`, source, target, label });

const hasPhone = { type: "group" as const, id: "cond-phone", operator: "AND" as const, children: [{ type: "rule" as const, id: "cond-phone-1", kind: "evidence_discovered" as const, targetId: "ev-001" }] };
const hasCctv = { type: "group" as const, id: "cond-cctv", operator: "AND" as const, children: [{ type: "rule" as const, id: "cond-cctv-1", kind: "evidence_discovered" as const, targetId: "ev-003" }] };

/** A question that only appears once the player has found a clue, held evidence or asked another question. */
const when = (id: string, kind: "clue_discovered" | "evidence_discovered" | "question_answered", targetId: string) =>
  ({ type: "group" as const, id: `cond-${id}`, operator: "AND" as const, children: [{ type: "rule" as const, id: `cond-${id}-1`, kind, targetId }] });

export const sarahNodes: DialogueNode[] = [
  { id: "s-start", type: "start", text: "Interview begins — Sarah Fernando, Cinnamon Gardens police station.", position: { x: 380, y: 0 } },
  { id: "s-open", type: "response", speaker: "Sarah", text: "I've already told the police everything. I was home that night.", position: { x: 380, y: 110 }, reaction: { emotion: "defensive", intensity: 1 } },
  { id: "s-menu", type: "choice", text: "Choose a question", position: { x: 380, y: 230 } },
  { id: "s-q1", type: "question", speaker: "Detective", text: "Where were you at 10 PM?", position: { x: 0, y: 360 } },
  { id: "s-a1", type: "response", speaker: "Sarah", text: "At home in Rajagiriya. Watching a series. Alone.", position: { x: 0, y: 470 }, reaction: { emotion: "calm", intensity: 1 } },
  { id: "s-q2", type: "question", speaker: "Detective", text: "What was your relationship with Daniel?", position: { x: 250, y: 360 } },
  { id: "s-a2", type: "response", speaker: "Sarah", text: "We dated for two years. It ended three months ago. We were still… civil.", position: { x: 250, y: 470 }, reaction: { emotion: "sad", intensity: 2 }, clueId: "clue-013" },
  { id: "s-q3", type: "question", speaker: "Detective", text: "When did you last speak to Daniel?", position: { x: 500, y: 360 }, condition: when("s3", "question_answered", "s-q2") },
  { id: "s-a3", type: "response", speaker: "Sarah", text: "Last week, maybe. I don't remember exactly.", position: { x: 500, y: 470 }, reaction: { emotion: "nervous", intensity: 2 }, isContradiction: true },
  { id: "s-q6", type: "question", speaker: "Detective", text: "Did Daniel mention any trouble at work?", position: { x: 1020, y: 360 }, condition: when("s6", "clue_discovered", "clue-013") },
  { id: "s-a6", type: "response", speaker: "Sarah", text: "He was stressed about the company accounts. He wouldn't say more — he never liked bringing work home.", position: { x: 1020, y: 470 }, reaction: { emotion: "sad", intensity: 1 } },
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
  e("s-menu", "s-q1", "Alibi"), e("s-menu", "s-q2", "Relationship"), e("s-menu", "s-q3", "Last contact"), e("s-menu", "s-q4", "10:17 call (needs phone)"), e("s-menu", "s-q6", "Daniel's work"),
  e("s-q6", "s-a6"), e("s-a6", "s-menu"),
  e("s-q1", "s-a1"), e("s-q2", "s-a2"), e("s-q3", "s-a3"), e("s-q4", "s-a4"),
  e("s-menu", "s-end", "That's all for now"),
  e("s-a1", "s-menu"), e("s-a2", "s-menu"), e("s-a3", "s-menu"),
  e("s-a4", "s-present", "Present evidence"), e("s-present", "s-react"),
  e("s-react", "s-clue"), e("s-react", "s-q5"), e("s-q5", "s-a5"), e("s-a5", "s-unlock"), e("s-unlock", "s-menu"), e("s-clue", "s-menu"),
];

export const michaelNodes: DialogueNode[] = [
  { id: "m-start", type: "start", text: "Interview begins — Michael Perera.", position: { x: 300, y: 0 } },
  { id: "m-open", type: "response", speaker: "Michael", text: "Terrible business. Daniel was like a brother. Ask whatever you need.", position: { x: 300, y: 110 }, reaction: { emotion: "calm", intensity: 1 } },
  { id: "m-menu", type: "choice", text: "Choose a question", position: { x: 300, y: 230 } },
  { id: "m-q1", type: "question", speaker: "Detective", text: "When did you leave Daniel's apartment?", position: { x: 0, y: 360 } },
  { id: "m-a1", type: "response", speaker: "Michael", text: "9:15 sharp. I drove to the office to finish the quarterly report.", position: { x: 0, y: 470 }, clueId: "clue-005" },
  { id: "m-q2", type: "question", speaker: "Detective", text: "How was the business doing?", position: { x: 300, y: 360 } },
  { id: "m-a2", type: "response", speaker: "Michael", text: "Never better. Daniel worried too much about the numbers.", position: { x: 300, y: 470 }, reaction: { emotion: "nervous", intensity: 1 } },
  { id: "m-q3", type: "question", speaker: "Detective", text: "Did you and Daniel argue that evening?", position: { x: 450, y: 360 }, condition: when("m3", "question_answered", "m-q1") },
  { id: "m-a3", type: "response", speaker: "Michael", text: "A disagreement about the audit, nothing more. We always sorted things out over a drink.", position: { x: 450, y: 470 }, reaction: { emotion: "defensive", intensity: 2 } },
  { id: "m-q4", type: "question", speaker: "Detective", text: "Were you with Daniel at 10:17 PM?", position: { x: 600, y: 360 }, condition: { type: "group", id: "cond-sarah", operator: "AND", children: [{ type: "rule", id: "cond-sarah-1", kind: "clue_discovered", targetId: "clue-002" }] } },
  { id: "m-present", type: "present_evidence", text: "Present: Building CCTV — 9:42 PM re-entry", evidenceId: "ev-003", position: { x: 600, y: 470 }, condition: hasCctv },
  { id: "m-react", type: "reaction", speaker: "Michael", text: "That could be anyone. ...Alright. I went back for my laptop charger. He was alive when I left.", position: { x: 600, y: 590 }, reaction: { emotion: "angry", intensity: 3 }, isContradiction: true },
  { id: "m-clue", type: "clue", text: "Clue: Michael's alibi broken", clueId: "clue-004", position: { x: 600, y: 710 } },
  { id: "m-unlock", type: "unlock", text: "Unlock: Parking Area", unlockTargetId: "loc-parking", position: { x: 600, y: 820 } },
  { id: "m-end", type: "end", text: "Interview complete", position: { x: 300, y: 940 } },
];

export const michaelEdges: DialogueEdge[] = [
  e("m-start", "m-open"), e("m-open", "m-menu"),
  e("m-menu", "m-q1", "Alibi"), e("m-menu", "m-q2", "Business"), e("m-menu", "m-q3", "The evening"), e("m-menu", "m-q4", "10:17 (needs Sarah clue)"),
  e("m-q3", "m-a3"), e("m-a3", "m-menu"),
  e("m-q1", "m-a1"), e("m-q2", "m-a2"), e("m-q4", "m-present", "Present CCTV"),
  e("m-present", "m-react"), e("m-react", "m-clue"), e("m-clue", "m-unlock"),
  e("m-menu", "m-end", "That's all for now"),
  e("m-a1", "m-menu"), e("m-a2", "m-menu"), e("m-unlock", "m-menu"),
];

export const nuwanNodes: DialogueNode[] = [
  { id: "n-start", type: "start", text: "Interview begins — Nuwan Silva, Apt 7C.", position: { x: 300, y: 0 } },
  { id: "n-open", type: "response", speaker: "Nuwan", text: "I was out working, sir. Deliveries all night.", position: { x: 300, y: 110 }, reaction: { emotion: "nervous", intensity: 2 } },
  { id: "n-menu", type: "choice", text: "Choose a question", position: { x: 300, y: 230 } },
  { id: "n-q2", type: "question", speaker: "Detective", text: "How well did you know Daniel?", position: { x: 0, y: 360 } },
  { id: "n-a2", type: "response", speaker: "Nuwan", text: "Only to nod hello in the corridor. He seemed a decent man, always tipped me at Christmas.", position: { x: 0, y: 470 }, reaction: { emotion: "calm", intensity: 1 } },
  { id: "n-q3", type: "question", speaker: "Detective", text: "Tell me about your night, start to finish.", position: { x: 250, y: 360 } },
  { id: "n-a3", type: "response", speaker: "Nuwan", text: "Shift started at six. Orders across Colombo 7. I… did not get home until late, that is all.", position: { x: 250, y: 470 }, reaction: { emotion: "nervous", intensity: 2 } },
  { id: "n-present", type: "present_evidence", text: "Present: Pharmacy Receipt — 10:04 PM", evidenceId: "ev-004", position: { x: 500, y: 360 }, condition: when("n-rec", "evidence_discovered", "ev-004") },
  { id: "n-react", type: "reaction", speaker: "Nuwan", text: "Okay, okay. I came home at ten for a headache. I heard them. Shouting about money, around 10:21.", position: { x: 500, y: 480 }, reaction: { emotion: "relieved", intensity: 2 } },
  { id: "n-clue", type: "clue", text: "Clue: Argument at 10:21 PM", clueId: "clue-011", position: { x: 700, y: 600 } },
  { id: "n-q1", type: "question", speaker: "Detective", text: "Did you see anyone leave?", position: { x: 500, y: 600 }, condition: { type: "group", id: "cond-n1", operator: "AND", children: [{ type: "rule", id: "cond-n1-1", kind: "clue_discovered", targetId: "clue-011" }] } },
  { id: "n-a1", type: "response", speaker: "Nuwan", text: "A man in a dark jacket, down the parking stairs. Maybe 10:30.", position: { x: 500, y: 710 } },
  { id: "n-end", type: "end", text: "Interview complete", position: { x: 300, y: 830 } },
];

export const nuwanEdges: DialogueEdge[] = [
  e("n-start", "n-open"), e("n-open", "n-menu"),
  e("n-menu", "n-q2", "Daniel"), e("n-menu", "n-q3", "His night"), e("n-menu", "n-present", "Show the pharmacy receipt"), e("n-menu", "n-q1", "Who left? (needs the argument clue)"), e("n-menu", "n-end", "That's all for now"),
  e("n-q2", "n-a2"), e("n-a2", "n-menu"), e("n-q3", "n-a3"), e("n-a3", "n-menu"),
  e("n-present", "n-react"), e("n-react", "n-clue"), e("n-react", "n-menu"),
  e("n-q1", "n-a1"), e("n-a1", "n-menu"),
];
