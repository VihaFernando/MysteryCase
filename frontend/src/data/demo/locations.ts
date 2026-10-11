import type { Location, Scene } from "@/types";
import { IMG } from "./images";

export const demoLocations: Location[] = [
  { id: "loc-apartment", name: "Daniel's Apartment", address: "7B, Green View Apartments, Colombo 03", description: "Two-bedroom apartment on the 7th floor. Front door found locked from inside; the parking stairwell door was not.", unlockedByDefault: true },
  { id: "loc-living", name: "Living Room", parentId: "loc-apartment", address: "7B — main room", description: "Where Daniel's body was found. Signs of a short struggle near the coffee table.", image: IMG.sceneLiving, unlockedByDefault: true },
  { id: "loc-kitchen", name: "Kitchen", parentId: "loc-apartment", address: "7B — kitchen", description: "An open wine bottle is missing from the rack; a drawer was left open.", image: IMG.sceneKitchen, unlockedByDefault: true },
  { id: "loc-bedroom", name: "Bedroom", parentId: "loc-apartment", address: "7B — master bedroom", description: "Daniel's home office desk holds a folder of company bank statements.", image: IMG.sceneBedroom, unlockedByDefault: false, unlockCondition: { type: "group", id: "c-bed", operator: "AND", children: [{ type: "rule", id: "c-bed-1", kind: "evidence_discovered", targetId: "ev-001" }] } },
  { id: "loc-entrance", name: "Apartment Entrance", parentId: "loc-apartment", address: "7th floor corridor", description: "Corridor with a ceiling CCTV camera covering the lift lobby and door 7B.", image: IMG.sceneEntrance, unlockedByDefault: true },
  { id: "loc-pharmacy", name: "Flower Road Pharmacy", address: "112 Flower Road, Colombo 07", description: "24-hour pharmacy 400m from the building. Receipts are time-stamped.", image: IMG.scenePharmacy, unlockedByDefault: false, unlockCondition: { type: "group", id: "c-ph", operator: "AND", children: [{ type: "rule", id: "c-ph-1", kind: "evidence_discovered", targetId: "ev-004" }] } },
  { id: "loc-parking", name: "Parking Area", address: "Basement B1, Green View Apartments", description: "Basement car park with a camera on the exit ramp.", image: IMG.sceneParking, unlockedByDefault: false, unlockCondition: { type: "group", id: "c-pk", operator: "AND", children: [{ type: "rule", id: "c-pk-1", kind: "clue_discovered", targetId: "clue-004" }] } },
  { id: "loc-office", name: "Michael's Office", address: "Perera & Perera Logistics, Union Place, Colombo 02", description: "Michael claims he worked here after 9:15 PM. The office door log shows no entry that night.", image: IMG.sceneOffice, unlockedByDefault: false, unlockCondition: { type: "group", id: "c-of", operator: "AND", children: [{ type: "rule", id: "c-of-1", kind: "interview_completed", targetId: "int-michael" }] } },
];

export const demoScenes: Scene[] = [
  {
    id: "scn-living",
    name: "Living Room — Night of the Incident",
    locationId: "loc-living",
    image: IMG.sceneLiving,
    description: "Primary crime scene. Daniel lies near the coffee table; a broken glass and his phone are nearby.",
    ambientAudio: "rain-city-night.ogg",
    order: 1,
    hotspots: [
      { id: "hs-body", name: "Body", type: "body", description: "Daniel Perera, face down.", x: 72, y: 66, radius: 6, initialInfo: "Daniel Perera, 34. No pulse. Blunt-force wound to the back of the head.", detailedInfo: "Lividity suggests death between 10:20 and 10:35 PM. Fragments of green glass in the hair — from a bottle, not a wine glass.", clueId: "clue-007", discoveryState: "visible", extraImages: [] },
      { id: "hs-phone", name: "Phone", type: "evidence", description: "Cracked phone near the rug edge.", x: 67, y: 37, radius: 3.5, initialInfo: "A cracked smartphone, screen still lit.", detailedInfo: "Last outgoing call at 10:17 PM to a saved contact: 'S'.", evidenceId: "ev-001", clueId: "clue-001", discoveryState: "visible", audio: "phone-buzz.ogg", extraImages: [] },
      { id: "hs-glass", name: "Wine Glass", type: "evidence", description: "Shattered glass with red wine.", x: 40, y: 50, radius: 4, initialInfo: "A broken wine glass on the coffee table. Wine still wet.", detailedInfo: "Two glasses were poured — only one is here. A partial print is visible on a large shard.", evidenceId: "ev-002", clueId: "clue-006", discoveryState: "visible", extraImages: [] },
      { id: "hs-table", name: "Coffee Table", type: "inspect", description: "Dark wood table, slightly displaced.", x: 52, y: 44, radius: 5, initialInfo: "The table has been shoved about 20 cm from its rug marks.", detailedInfo: "Scuff marks indicate a struggle. A coaster ring shows a second glass stood here.", discoveryState: "visible", extraImages: [] },
      { id: "hs-window", name: "Window", type: "inspect", description: "Floor-to-ceiling window.", x: 88, y: 16, radius: 5, initialInfo: "Window locked from inside. 7th floor — no external access.", detailedInfo: "Rules out entry via window. Killer must have used a door.", discoveryState: "visible", extraImages: [] },
      { id: "hs-carpet", name: "Carpet", type: "inspect", description: "Patterned rug.", x: 25, y: 78, radius: 4.5, initialInfo: "A damp patch near the edge of the rug.", detailedInfo: "Smells of wine and cleaning solution — someone tried to wipe it. Leads toward the kitchen.", clueId: "clue-008", discoveryState: "hidden", unlockCondition: { type: "group", id: "c-carpet", operator: "AND", children: [{ type: "rule", id: "c-carpet-1", kind: "evidence_discovered", targetId: "ev-002" }] }, extraImages: [] },
      { id: "hs-sofa", name: "Sofa", type: "inspect", description: "Beige three-seat sofa.", x: 30, y: 22, radius: 5, initialInfo: "A grey throw half-pulled to the floor.", detailedInfo: "Between the cushions: a business card for 'Wijesinghe & Co. Forensic Auditors' with Monday 9 AM written on it.", clueId: "clue-009", discoveryState: "visible", extraImages: [] },
    ],
  },
  {
    id: "scn-kitchen",
    name: "Kitchen",
    locationId: "loc-kitchen",
    image: IMG.sceneKitchen,
    description: "Wine rack missing one bottle. An opened drawer and a wiped counter.",
    order: 2,
    hotspots: [
      { id: "hs-bottle", name: "Wine Rack", type: "inspect", description: "Six-slot rack, one empty.", x: 39, y: 40, radius: 4, initialInfo: "One slot is empty — the bottle on the counter is a different vintage.", detailedInfo: "The missing bottle matches green glass fragments found on the body.", clueId: "clue-007", discoveryState: "visible", extraImages: [] },
      { id: "hs-drawer", name: "Open Drawer", type: "inspect", description: "Cutlery drawer pulled open.", x: 64, y: 62, radius: 5, initialInfo: "Kitchen towels missing from the drawer.", detailedInfo: "Towels were likely used to clean up the wine spill.", discoveryState: "visible", extraImages: [] },
      { id: "hs-counter", name: "Counter", type: "evidence", description: "Glass of wine left on counter.", x: 45, y: 46, radius: 3.5, initialInfo: "A second glass of wine, half-finished.", detailedInfo: "Moved here from the living room. Lipstick-free rim — the guest was likely male.", evidenceId: "ev-005", discoveryState: "visible", extraImages: [] },
    ],
  },
  {
    id: "scn-entrance",
    name: "7th Floor Corridor",
    locationId: "loc-entrance",
    image: IMG.sceneEntrance,
    description: "Lift lobby and apartment door. CCTV camera overhead.",
    order: 3,
    hotspots: [
      { id: "hs-cctv", name: "CCTV Camera", type: "evidence", description: "Ceiling dome camera.", x: 21, y: 9, radius: 4, initialInfo: "A building security camera covering the corridor.", detailedInfo: "Footage can be requested from building management.", evidenceId: "ev-003", clueId: "clue-003", discoveryState: "visible", extraImages: [] },
      { id: "hs-door", name: "Door 7B", type: "inspect", description: "Daniel's front door.", x: 79, y: 44, radius: 5, initialInfo: "Locked deadbolt, no signs of forced entry.", detailedInfo: "The deadbolt locks automatically when the door closes. A locked door proves nothing.", clueId: "clue-010", discoveryState: "visible", extraImages: [] },
      { id: "hs-receipt", name: "Crumpled Receipt", type: "evidence", description: "Paper scrap by the door mat.", x: 60, y: 90, radius: 3.2, initialInfo: "A crumpled pharmacy receipt lies near the door mat.", detailedInfo: "Flower Road Pharmacy, 10:04 PM. Painkillers and a bandage. Someone was in this corridor after the argument.", evidenceId: "ev-004", discoveryState: "visible", extraImages: [] },
      { id: "hs-noticeboard", name: "Notice Board", type: "evidence", description: "Building notice board.", x: 58, y: 42, radius: 5, initialInfo: "The building manager has pinned a signed statement to the board.", detailedInfo: "Nuwan's witness statement describing the shouting match he overheard at 10:21 PM.", evidenceId: "ev-006", unlockCondition: { type: "group", id: "uc-hs-noticeboard", operator: "AND", children: [{ type: "rule", id: "uc-hs-noticeboard-1", kind: "interview_completed", targetId: "int-nuwan" }] }, discoveryState: "hidden", extraImages: [] },
      { id: "hs-stairs", name: "Stairwell", type: "navigation", description: "Leads down to the parking area.", x: 36, y: 50, radius: 5, initialInfo: "Emergency stairwell to basement parking.", detailedInfo: "No camera inside the stairwell — but the parking exit is covered.", discoveryState: "locked", unlockCondition: { type: "group", id: "c-st", operator: "AND", children: [{ type: "rule", id: "c-st-1", kind: "clue_discovered", targetId: "clue-004" }] }, extraImages: [] },
    ],
  },
  {
    id: "scn-bedroom",
    name: "Bedroom",
    locationId: "loc-bedroom",
    image: IMG.sceneBedroom,
    description: "Daniel's bedroom. A desk with a locked drawer, a bed and a wardrobe.",
    order: 4,
    hotspots: [
      { id: "hs-desk-drawer", name: "Desk Drawer", type: "evidence", description: "Desk drawer with a brass handle.", x: 78, y: 56, radius: 5, initialInfo: "The drawer is stuffed with ledgers and printed statements.", detailedInfo: "Daniel's business records: payments to an account controlled by Michael, dated over eight months.", evidenceId: "ev-007", discoveryState: "visible", extraImages: [] },
      { id: "hs-bed", name: "Bed", type: "inspect", description: "Unmade double bed.", x: 36, y: 55, radius: 7, initialInfo: "The bed is unmade. Daniel hadn't slept here tonight.", detailedInfo: "A phone charger is plugged in beside the bed, but no phone. It was found in the living room.", discoveryState: "visible", extraImages: [] },
      { id: "hs-wardrobe", name: "Wardrobe", type: "inspect", description: "Tall wardrobe.", x: 11, y: 40, radius: 5, initialInfo: "Suits hang neatly. Nothing out of place.", detailedInfo: "A gym bag at the bottom contains a spare phone SIM and a contact list backup.", discoveryState: "visible", extraImages: [] },
      { id: "hs-nightstand", name: "Nightstand", type: "inspect", description: "Small bedside table.", x: 55, y: 58, radius: 3.5, initialInfo: "A lamp, a glass of water and a paperback.", detailedInfo: "The paperback's receipt marks the page: bought last week. Nothing connected to the case.", discoveryState: "visible", extraImages: [] },
    ],
  },
  {
    id: "scn-pharmacy",
    name: "Flower Road Pharmacy",
    locationId: "loc-pharmacy",
    image: IMG.scenePharmacy,
    description: "24-hour pharmacy on Flower Road. The night pharmacist remembers faces.",
    order: 5,
    hotspots: [
      { id: "hs-pharm-counter", name: "Pharmacy Counter", type: "inspect", description: "Main counter.", x: 62, y: 62, radius: 7, initialInfo: "The pharmacist confirms a man bought painkillers and a bandage at 10:04 PM.", detailedInfo: "He paid cash and kept his left hand wrapped in a cloth. That matches the receipt found in the corridor.", discoveryState: "visible", extraImages: [] },
      { id: "hs-pharm-printer", name: "Receipt Printer", type: "inspect", description: "Till receipt printer.", x: 72, y: 50, radius: 3, initialInfo: "The till logs every sale with a timestamp.", detailedInfo: "The log shows the 10:04 PM sale, one of only three that night.", discoveryState: "visible", extraImages: [] },
      { id: "hs-pharm-shelf", name: "Medicine Shelf", type: "inspect", description: "Shelves of medicine.", x: 20, y: 30, radius: 6, initialInfo: "Rows of over-the-counter medicine.", detailedInfo: "Nothing here relates to the case.", discoveryState: "visible", extraImages: [] },
    ],
  },
  {
    id: "scn-parking",
    name: "Basement Parking B1",
    locationId: "loc-parking",
    image: IMG.sceneParking,
    description: "Basement parking of Green View Apartments. One camera covers the exit ramp.",
    order: 6,
    hotspots: [
      { id: "hs-parking-camera", name: "Parking Camera", type: "evidence", description: "Camera covering the exit.", x: 83, y: 17, radius: 4, initialInfo: "A camera with a red recording light covers the exit ramp.", detailedInfo: "Footage shows a black saloon, plate CAB-4471, leaving at 10:33 PM.", evidenceId: "ev-008", discoveryState: "visible", extraImages: [] },
      { id: "hs-parking-car", name: "Black Saloon", type: "inspect", description: "Parked black saloon.", x: 41, y: 65, radius: 6, initialInfo: "A black saloon is parked in Michael's usual bay.", detailedInfo: "The bonnet is still warm. Michael's car was driven recently.", discoveryState: "visible", extraImages: [] },
      { id: "hs-parking-ramp", name: "Exit Ramp", type: "inspect", description: "Ramp to the street.", x: 92, y: 70, radius: 5, initialInfo: "The ramp leads to the street.", detailedInfo: "A barrier logs every plate. The log is held by building management.", discoveryState: "visible", extraImages: [] },
    ],
  },
  {
    id: "scn-office",
    name: "Michael's Office",
    locationId: "loc-office",
    image: IMG.sceneOffice,
    description: "Michael's office at Perera & Perera Logistics. He claims he worked here after 9:15 PM.",
    order: 7,
    hotspots: [
      { id: "hs-office-log", name: "Door Access Log", type: "inspect", description: "Electronic door log reader.", x: 88, y: 38, radius: 4, initialInfo: "The access log shows every badge swipe.", detailedInfo: "No swipe for Michael after 6:40 PM that night. His alibi is not supported.", discoveryState: "visible", extraImages: [] },
      { id: "hs-office-desk", name: "Desk & Monitor", type: "inspect", description: "Michael's desk.", x: 31, y: 55, radius: 6, initialInfo: "The monitor is off and the keyboard is cold.", detailedInfo: "The desk calendar has the evening of the incident circled, with no meeting listed.", discoveryState: "visible", extraImages: [] },
    ],
  },
];
