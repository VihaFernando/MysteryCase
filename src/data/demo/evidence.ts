import type { Evidence, CaseDocument } from "@/types";
import { IMG } from "./images";

export const demoEvidence: Evidence[] = [
  {
    id: "ev-001", code: "EVID-001", name: "Daniel's Mobile Phone", type: "digital", image: IMG.evPhone,
    description: "Cracked smartphone found beside the rug, partially under the sofa edge.",
    foundAtLocationId: "loc-living", foundInSceneId: "scn-living", discoveredBy: "Player — Living Room hotspot",
    relatedSuspectIds: ["sus-sarah"], relatedClueIds: ["clue-001", "clue-002"], relatedTimelineIds: ["tl-06"],
    isKey: true, isRedHerring: false,
    inspections: [
      { id: "ins-1-1", stage: 1, title: "Initial look", description: "Cracked mobile phone found under sofa.", requirements: [] },
      { id: "ins-1-2", stage: 2, title: "Call log", description: "Last outgoing call: 10:17 PM.", requirements: [{ kind: "previous_stage", label: "Stage 1 viewed" }] },
      { id: "ins-1-3", stage: 3, title: "Call duration", description: "Call lasted 43 seconds.", requirements: [{ kind: "previous_stage", label: "Stage 2 viewed" }, { kind: "player_action", label: "Tap 'Details' on call entry" }] },
      { id: "ins-1-4", stage: 4, title: "Contact identified", description: "Number belongs to Sarah Fernando.", requirements: [{ kind: "previous_stage", label: "Stage 3 viewed" }, { kind: "location", targetId: "loc-bedroom", label: "Visited Bedroom (contact list backup)" }], revealsClueId: "clue-002" },
    ],
  },
  {
    id: "ev-002", code: "EVID-002", name: "Broken Wine Glass", type: "physical", image: IMG.evGlass,
    description: "Shattered wine glass on the coffee table, red wine still wet.",
    foundAtLocationId: "loc-living", foundInSceneId: "scn-living", discoveredBy: "Player — Living Room hotspot",
    relatedSuspectIds: ["sus-michael"], relatedClueIds: ["clue-006"], relatedTimelineIds: ["tl-08"],
    isKey: false, isRedHerring: false,
    inspections: [
      { id: "ins-2-1", stage: 1, title: "Shards", description: "Glass broke on impact with the table edge.", requirements: [] },
      { id: "ins-2-2", stage: 2, title: "Partial print", description: "A partial fingerprint is visible on the largest shard.", requirements: [{ kind: "previous_stage", label: "Stage 1 viewed" }], revealsClueId: "clue-006" },
    ],
  },
  {
    id: "ev-003", code: "EVID-003", name: "Building CCTV", type: "footage", image: IMG.evCctv,
    description: "Corridor camera footage, 8:00 PM – 11:00 PM.",
    foundAtLocationId: "loc-entrance", foundInSceneId: "scn-entrance", discoveredBy: "Request from building management",
    relatedSuspectIds: ["sus-michael"], relatedClueIds: ["clue-003", "clue-004"], relatedTimelineIds: ["tl-01", "tl-03"],
    isKey: true, isRedHerring: false,
    inspections: [
      { id: "ins-3-1", stage: 1, title: "8:45 PM", description: "Michael Perera arrives and enters 7B.", requirements: [] },
      { id: "ins-3-2", stage: 2, title: "9:14 PM", description: "Michael leaves via the lift.", requirements: [{ kind: "previous_stage", label: "Stage 1 viewed" }] },
      { id: "ins-3-3", stage: 3, title: "9:42 PM", description: "A man in a dark jacket enters from the stairwell and knocks on 7B. Face partly hidden.", requirements: [{ kind: "previous_stage", label: "Stage 2 viewed" }], revealsClueId: "clue-003" },
      { id: "ins-3-4", stage: 4, title: "Enhanced frame", description: "Enhancement shows the same watch and jacket Michael wore at 8:45 PM.", requirements: [{ kind: "clue", targetId: "clue-005", label: "Michael's alibi recorded" }], revealsClueId: "clue-004" },
    ],
  },
  {
    id: "ev-004", code: "EVID-004", name: "Pharmacy Receipt", type: "document", image: IMG.evReceipt,
    description: "Flower Road Pharmacy receipt, found in the corridor bin.",
    foundAtLocationId: "loc-entrance", foundInSceneId: "scn-entrance", discoveredBy: "Corridor bin search",
    relatedSuspectIds: ["sus-nuwan"], relatedClueIds: ["clue-011"], relatedTimelineIds: ["tl-05"],
    isKey: false, isRedHerring: false,
    inspections: [
      { id: "ins-4-1", stage: 1, title: "Receipt", description: "Painkillers, paid by card ending 4821.", requirements: [] },
      { id: "ins-4-2", stage: 2, title: "Timestamp", description: "Printed 10:04 PM. Card belongs to Nuwan Silva.", requirements: [{ kind: "previous_stage", label: "Stage 1 viewed" }, { kind: "location", targetId: "loc-pharmacy", label: "Visited Pharmacy" }], revealsClueId: "clue-011" },
    ],
  },
  {
    id: "ev-005", code: "EVID-005", name: "Fingerprint", type: "forensic", image: IMG.evPrint,
    description: "Lifted prints from the glass shard and the kitchen counter glass.",
    foundAtLocationId: "loc-kitchen", foundInSceneId: "scn-kitchen", discoveredBy: "Forensics lab",
    relatedSuspectIds: ["sus-michael"], relatedClueIds: ["clue-006", "clue-007"], relatedTimelineIds: ["tl-08"],
    isKey: true, isRedHerring: false,
    inspections: [
      { id: "ins-5-1", stage: 1, title: "Lift", description: "Right thumb print recovered.", requirements: [{ kind: "evidence", targetId: "ev-002", label: "Wine Glass collected" }] },
      { id: "ins-5-2", stage: 2, title: "Match", description: "Matches Michael Perera (company access-card records).", requirements: [{ kind: "previous_stage", label: "Stage 1 viewed" }], revealsClueId: "clue-006" },
    ],
  },
  {
    id: "ev-006", code: "EVID-006", name: "Witness Statement", type: "testimony", image: IMG.evStatement,
    description: "Nuwan Silva's written statement after interview.",
    foundAtLocationId: "loc-entrance", foundInSceneId: "scn-entrance", discoveredBy: "Nuwan interview",
    relatedSuspectIds: ["sus-nuwan", "sus-michael"], relatedClueIds: ["clue-011", "clue-012"], relatedTimelineIds: ["tl-07", "tl-09"],
    isKey: true, isRedHerring: false,
    inspections: [
      { id: "ins-6-1", stage: 1, title: "Argument", description: "Heard two men shouting about 'the money' at around 10:21 PM.", requirements: [] },
      { id: "ins-6-2", stage: 2, title: "Departure", description: "Saw a man in a dark jacket go down the parking stairwell at 10:31 PM.", requirements: [{ kind: "previous_stage", label: "Stage 1 viewed" }], revealsClueId: "clue-012" },
    ],
  },
  {
    id: "ev-007", code: "EVID-007", name: "Daniel's Business Records", type: "document", image: IMG.evRecords,
    description: "Folder of bank statements and ledger printouts in the bedroom desk.",
    foundAtLocationId: "loc-bedroom", foundInSceneId: "scn-bedroom", discoveredBy: "Bedroom desk",
    relatedSuspectIds: ["sus-michael", "sus-sarah"], relatedClueIds: ["clue-009", "clue-005"], relatedTimelineIds: ["tl-00"],
    isKey: true, isRedHerring: false,
    inspections: [
      { id: "ins-7-1", stage: 1, title: "Statements", description: "Company account statements with highlighted transfers.", requirements: [] },
      { id: "ins-7-2", stage: 2, title: "Discrepancy", description: "LKR 18.4M transferred to an account controlled by Michael over 14 months.", requirements: [{ kind: "previous_stage", label: "Stage 1 viewed" }] },
      { id: "ins-7-3", stage: 3, title: "Sticky note", description: "Daniel's note: 'Auditors Monday. Tell M tonight?'", requirements: [{ kind: "previous_stage", label: "Stage 2 viewed" }], revealsClueId: "clue-009" },
    ],
  },
  {
    id: "ev-008", code: "EVID-008", name: "Parking Camera Footage", type: "footage", image: IMG.evParking,
    description: "Basement exit-ramp camera, 10:00 PM – 11:00 PM.",
    foundAtLocationId: "loc-parking", foundInSceneId: "scn-parking", discoveredBy: "Parking attendant",
    relatedSuspectIds: ["sus-michael"], relatedClueIds: ["clue-012"], relatedTimelineIds: ["tl-09"],
    isKey: false, isRedHerring: false,
    inspections: [
      { id: "ins-8-1", stage: 1, title: "10:33 PM", description: "Michael's black saloon (CAB-4471) exits the basement.", requirements: [{ kind: "location", targetId: "loc-parking", label: "Visited Parking Area" }] },
    ],
  },
];

export const demoDocuments: CaseDocument[] = [
  { id: "doc-001", title: "Initial Police Report", kind: "report", body: "Officers responded to 7B Green View Apartments at 10:48 PM following a call from building security. Victim Daniel Perera found deceased in the living room. Front door locked. No forced entry." },
  { id: "doc-002", title: "Nuwan Silva — Signed Statement", kind: "statement", body: "I heard shouting at around 10:20. Two men. One said 'you'll ruin me'. Ten minutes later I saw a man in a dark jacket going down the stairs.", evidenceId: "ev-006" },
  { id: "doc-003", title: "Auditor Appointment Email", kind: "letter", body: "Dear Mr. Perera, confirming your meeting with our forensic accounting team on Monday at 9:00 AM.", evidenceId: "ev-007" },
];
