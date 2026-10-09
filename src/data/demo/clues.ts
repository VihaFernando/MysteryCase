import type { Clue, ClueConnection, Trigger } from "@/types";

export const demoClues: Clue[] = [
  { id: "clue-001", code: "CLU-001", title: "Last call at 10:17 PM", description: "Daniel's last outgoing call was at 10:17 PM.", category: "context", importance: "major", sourceEvidenceIds: ["ev-001"], sourceInterviewIds: [], suspectIds: ["sus-sarah"], isRedHerring: false },
  { id: "clue-002", code: "CLU-002", title: "Sarah lied about the call", description: "Sarah denied speaking to Daniel; the phone proves a 43-second call.", category: "contradiction", importance: "major", sourceEvidenceIds: ["ev-001"], sourceInterviewIds: ["int-sarah"], suspectIds: ["sus-sarah"], isRedHerring: false },
  { id: "clue-003", code: "CLU-003", title: "Unknown visitor at 9:42 PM", description: "CCTV shows a man entering from the stairwell at 9:42 PM.", category: "opportunity", importance: "critical", sourceEvidenceIds: ["ev-003"], sourceInterviewIds: [], suspectIds: ["sus-michael"], isRedHerring: false },
  { id: "clue-004", code: "CLU-004", title: "Michael's alibi broken", description: "The 9:42 PM visitor is Michael; he admits returning.", category: "contradiction", importance: "critical", sourceEvidenceIds: ["ev-003"], sourceInterviewIds: ["int-michael"], suspectIds: ["sus-michael"], isRedHerring: false },
  { id: "clue-005", code: "CLU-005", title: "Michael claims he left at 9:15", description: "Michael's stated alibi: office from 9:15 PM.", category: "alibi", importance: "major", sourceEvidenceIds: [], sourceInterviewIds: ["int-michael"], suspectIds: ["sus-michael"], isRedHerring: false },
  { id: "clue-006", code: "CLU-006", title: "Michael's print on glass", description: "Fingerprint on the broken glass matches Michael.", category: "method", importance: "critical", sourceEvidenceIds: ["ev-002", "ev-005"], sourceInterviewIds: [], suspectIds: ["sus-michael"], isRedHerring: false },
  { id: "clue-007", code: "CLU-007", title: "Weapon was the wine bottle", description: "Green glass in the wound matches the missing kitchen bottle.", category: "method", importance: "critical", sourceEvidenceIds: ["ev-005"], sourceInterviewIds: [], suspectIds: [], isRedHerring: false },
  { id: "clue-008", code: "CLU-008", title: "Scene was cleaned", description: "Wine spill wiped with kitchen towels — the killer stayed after the attack.", category: "context", importance: "minor", sourceEvidenceIds: ["ev-002"], sourceInterviewIds: [], suspectIds: [], isRedHerring: false },
  { id: "clue-009", code: "CLU-009", title: "Daniel's private matter", description: "Daniel was preparing to report LKR 18.4M of embezzlement to auditors on Monday.", category: "motive", importance: "critical", sourceEvidenceIds: ["ev-007"], sourceInterviewIds: ["int-sarah"], suspectIds: ["sus-michael", "sus-sarah"], isRedHerring: false },
  { id: "clue-010", code: "CLU-010", title: "Locked door means nothing", description: "Auto-locking deadbolt; anyone leaving would lock it.", category: "context", importance: "minor", sourceEvidenceIds: [], sourceInterviewIds: [], suspectIds: [], isRedHerring: false },
  { id: "clue-011", code: "CLU-011", title: "Argument at 10:21 PM", description: "Nuwan heard two men arguing about money.", category: "opportunity", importance: "major", sourceEvidenceIds: ["ev-004", "ev-006"], sourceInterviewIds: ["int-nuwan"], suspectIds: ["sus-nuwan", "sus-michael"], isRedHerring: false },
  { id: "clue-012", code: "CLU-012", title: "Man left via parking stairs", description: "A man left down the stairwell at 10:31 PM; Michael's car exits 10:33 PM.", category: "opportunity", importance: "major", sourceEvidenceIds: ["ev-006", "ev-008"], sourceInterviewIds: ["int-nuwan"], suspectIds: ["sus-michael"], isRedHerring: false },
  { id: "clue-013", code: "CLU-013", title: "Sarah's jealousy", description: "Sarah reportedly resented Daniel's new relationship. Unfounded.", category: "red_herring", importance: "minor", sourceEvidenceIds: [], sourceInterviewIds: ["int-sarah"], suspectIds: ["sus-sarah"], isRedHerring: true },
];

export const demoClueConnections: ClueConnection[] = [
  { id: "cc-1", from: "clue-001", to: "clue-002", relation: "leads_to", label: "Call reveals lie" },
  { id: "cc-2", from: "clue-002", to: "clue-009", relation: "leads_to", label: "Sarah explains private matter" },
  { id: "cc-3", from: "clue-005", to: "clue-004", relation: "contradicts", label: "CCTV contradicts alibi" },
  { id: "cc-4", from: "clue-003", to: "clue-004", relation: "supports", label: "Visitor identified" },
  { id: "cc-5", from: "clue-006", to: "clue-007", relation: "supports", label: "Print + weapon" },
  { id: "cc-6", from: "clue-009", to: "clue-004", relation: "explains", label: "Motive for return" },
  { id: "cc-7", from: "clue-011", to: "clue-012", relation: "leads_to", label: "Witness timeline" },
  { id: "cc-8", from: "clue-008", to: "clue-007", relation: "supports", label: "Cleanup hides bottle" },
  { id: "cc-9", from: "clue-013", to: "clue-002", relation: "contradicts", label: "Red herring vs. real reason" },
];

export const demoTriggers: Trigger[] = [
  { id: "trg-1", name: "Phone discovered", description: "Finding the phone unlocks the 10:17 PM question in Sarah's interview.", enabled: true,
    condition: { type: "group", id: "t1", operator: "AND", children: [{ type: "rule", id: "t1a", kind: "evidence_discovered", targetId: "ev-001" }] },
    actions: [{ id: "a1", kind: "unlock_question", targetId: "s-q4", label: "Unlock Sarah Q: 'Did you call Daniel at 10:17 PM?'" }, { id: "a1b", kind: "unlock_location", targetId: "loc-bedroom", label: "Unlock Bedroom" }] },
  { id: "trg-2", name: "CCTV discovered", description: "CCTV unlocks Michael alibi contradiction.", enabled: true,
    condition: { type: "group", id: "t2", operator: "AND", children: [{ type: "rule", id: "t2a", kind: "evidence_discovered", targetId: "ev-003" }, { type: "rule", id: "t2b", kind: "clue_discovered", targetId: "clue-005" }] },
    actions: [{ id: "a2", kind: "reveal_contradiction", targetId: "clue-004", label: "Unlock Michael alibi contradiction" }] },
  { id: "trg-3", name: "Sarah contradiction discovered", description: "Unlocks Daniel's private matter clue.", enabled: true,
    condition: { type: "group", id: "t3", operator: "AND", children: [{ type: "rule", id: "t3a", kind: "clue_discovered", targetId: "clue-002" }, { type: "rule", id: "t3b", kind: "interview_completed", targetId: "int-sarah" }] },
    actions: [{ id: "a3", kind: "unlock_clue", targetId: "clue-009", label: "Unlock 'Daniel's private matter'" }, { id: "a3b", kind: "unlock_question", targetId: "m-q4", label: "Unlock Michael Q: 'Were you with Daniel at 10:17?'" }] },
  { id: "trg-4", name: "Pharmacy receipt found", description: "Receipt unlocks the pharmacy and the neighbor's interview.", enabled: true,
    condition: { type: "group", id: "t4", operator: "OR", children: [{ type: "rule", id: "t4a", kind: "evidence_discovered", targetId: "ev-004" }, { type: "rule", id: "t4b", kind: "location_visited", targetId: "loc-pharmacy" }] },
    actions: [{ id: "a4", kind: "unlock_interview", targetId: "int-nuwan", label: "Unlock Nuwan interview" }, { id: "a4b", kind: "unlock_location", targetId: "loc-pharmacy", label: "Unlock Flower Road Pharmacy" }] },
  { id: "trg-5", name: "Alibi broken", description: "Michael's contradiction opens the parking area.", enabled: true,
    condition: { type: "group", id: "t5", operator: "AND", children: [{ type: "rule", id: "t5a", kind: "clue_discovered", targetId: "clue-004" }, { type: "group", id: "t5g", operator: "OR", negate: false, children: [{ type: "rule", id: "t5b", kind: "suspect_interviewed", targetId: "sus-michael" }, { type: "rule", id: "t5c", kind: "case_progress", targetId: "60" }] }] },
    actions: [{ id: "a5", kind: "unlock_location", targetId: "loc-parking", label: "Unlock Parking Area" }, { id: "a5b", kind: "unlock_timeline_event", targetId: "tl-09", label: "Reveal 10:33 PM car exit" }] },
];
