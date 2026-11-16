import type { CaseBundle, Clue, ConditionGroup, ConditionKind, DialogueNode, Evidence, Hotspot, Interview, Objection, Scene, SearchTool, Statement, StatementChoice, StatementReply, Suspect } from "@/types";
import { IMG } from "./images";
import cover from "@/assets/monsoon-cover.jpg";
import anika from "@/assets/monsoon-anika.jpg";
import rohan from "@/assets/monsoon-rohan.jpg";
import malini from "@/assets/monsoon-malini.jpg";
import dev from "@/assets/monsoon-dev.jpg";
import study from "@/assets/monsoon-study.jpg";
import accounts from "@/assets/monsoon-accounts.jpg";
import laundry from "@/assets/monsoon-laundry.jpg";
import tea from "@/assets/monsoon-tea.jpg";

// All references are namespaced so this case can coexist with any other bundle.
const id = (key: string) => `ml-${key}`;
const when = (kind: ConditionKind, ...keys: string[]): ConditionGroup => ({
  id: id(`if-${kind}-${keys.join("-")}`), type: "group", operator: "AND",
  children: keys.map((key) => ({ id: id(`rule-${kind}-${key}`), type: "rule", kind, targetId: id(key) })),
});
const either = (...children: ConditionGroup[]): ConditionGroup => ({ id: id(`either-${children.map(c => c.id).join("-")}`), type: "group", operator: "OR", children });
const all = (...children: ConditionGroup[]): ConditionGroup => ({ id: id(`all-${children.map(c => c.id).join("-")}`), type: "group", operator: "AND", children });
const not = (g: ConditionGroup): ConditionGroup => ({ ...g, id: `${g.id}-not`, negate: true });
const clueIf = (...keys: string[]) => when("clue_discovered", ...keys);
const chose = (key: string) => when("player_choice", key);
const burnt = clueIf("burnt");
const motive = "Silence the audit exposing stolen staff pension funds";
const method = "Strike with the brass tea weight, take the ledger page, and leave through the self-latching door";
const createdAt = "2026-11-15T06:00:00Z";

const alibi = (text: string, fail: string): Objection[] => [{ text, beatenBy: [], fail }];
const suspects: Suspect[] = [
  { id: id("anika"), name: "Anika Jayawardene", age: 32, occupation: "Restoration architect", portrait: anika, relationship: "Daughter of the victim", role: "suspect", publicInfo: "Anika returned to restore the hotel her mother loved. Staff heard her argue with her father over its proposed sale.", claim: "I left his study at 20:42. From 20:48 until the lights returned, I was on a video call at reception.", hiddenInfo: ["She took her late mother's letters from the study, not the accounts.", "Her father had privately cancelled the sale that afternoon."], motive: "Prevent the sale of her mother's hotel", isKiller: false, isRedHerring: true, personality: "Grieving and guarded; responds to care, resents assumptions about inheritance.", interviewIds: [id("int-anika")], objections: alibi("I was on a recorded video call at reception from 20:48 to 21:04. Play it.", "The duty officer plays the recording. Anika is on camera for the whole of the death window. Whatever else she is hiding, she did not strike the blow.") },
  { id: id("rohan"), name: "Rohan Senanayake", age: 46, occupation: "Financial manager", portrait: rohan, relationship: "Trusted employee of eighteen years", role: "suspect", publicInfo: "Rohan handles wages, suppliers, and the pension trust. He tells the police that Arun had recently become forgetful.", claim: "I was in the accounts office all evening. My 20:55 supplier email proves it.", hiddenInfo: ["He diverted pension contributions into a company he controlled.", "He scheduled an email at 20:31, killed Arun at 20:54, and hid the weapon and torn page in the laundry."], motive, isKiller: true, isRedHerring: false, personality: "Precise and courteous until records contradict him; then tries to make the victim seem unreliable.", interviewIds: [id("int-rohan"), id("int-confrontation")], objections: [
    { text: "My email left the accounts office at 20:55. I was at my desk.", beatenBy: ["scheduled-email", "false-alibi", "dispatch", "no-account"].map(id), fail: "Rohan's timestamp stands unanswered. On paper, he never left his desk." },
    { text: "Suppose I stepped away. Nothing puts me inside that study.", beatenBy: ["page-print", "weight-print", "basket-return", "was-in-study", "confession"].map(id), fail: "Without something that places him in the room, the magistrate hears only a man who left his desk during a power cut." },
    { text: "And why would I harm the man who employed me for eighteen years?", beatenBy: ["pension-trail", "motive-proved", "loan-story", "ledger", "burnt-proof"].map(id), fail: "With no motive on the record, Rohan's lawyer calls it a quarrel between friends that nobody witnessed." },
  ] },
  { id: id("malini"), name: "Malini Fernando", age: 51, occupation: "Head chef", portrait: malini, relationship: "Employee and staff pension representative", role: "suspect", publicInfo: "Malini threatened to take Arun to the authorities over missing pension payments. She brought his last tea.", claim: "I delivered tea at 20:45. During the outage I stayed with the electrician at the generator.", hiddenInfo: ["She suspected pension theft but did not know who was responsible.", "She saw someone with a green sleeve carrying a linen bundle after the lights returned."], motive: "Revenge for the missing staff pensions", isKiller: false, isRedHerring: true, personality: "Blunt and protective of her staff; will distinguish what she saw from what she merely suspects.", interviewIds: [id("int-malini")], objections: alibi("I was holding a lantern for the electrician. His camera never stopped running.", "The bodycam file is continuous. Malini is in frame from 20:49 to 21:03, and the tea she served was clean.") },
  { id: id("dev"), name: "Dev Wijesinghe", age: 29, occupation: "Investigative journalist", portrait: dev, relationship: "Invited to meet the victim privately", role: "suspect", publicInfo: "Dev booked under an abbreviated name. He has been investigating the hotel's finances and refuses to name his source.", claim: "I was photographing the storm from the veranda. Arun was going to give me a statement at 21:15.", hiddenInfo: ["He recorded Arun's argument with Anika without permission.", "His time-lapse camera recorded him throughout the death window; he can surrender the original card."], motive: "Turn an unproven scandal into a career-making story", isKiller: false, isRedHerring: true, personality: "Wry and cautious; cooperates when asked to verify facts instead of betray a source.", interviewIds: [id("int-dev")], objections: alibi("Check my time-lapse. I am in the mirror in every single frame.", "Every ten-second frame shows Dev on the veranda, and the stair door in the reflection never opens.") },
];

const clue = (key: string, title: string, description: string, category: Clue["category"], evidence: string[] = [], people: string[] = [], interviews: string[] = []): Clue => ({
  id: id(key), code: `ML-C${String(cluesCount++).padStart(2, "0")}`, title, description, category,
  importance: ["method", "motive", "contradiction"].includes(category) ? "critical" : "major",
  sourceEvidenceIds: evidence.map(id), sourceInterviewIds: interviews.map(id), suspectIds: people.map(id), isRedHerring: category === "red_herring",
});
let cluesCount = 1;
const clues: Clue[] = [
  // Physical record
  clue("death-window", "A blow during the blackout", "One edged, blunt impact to the left temple. Death between 20:50 and 21:00. The outage lasted 20:50–21:02.", "method", ["report"]),
  clue("latch-truth", "Locked does not mean occupied", "The study door has a spring latch that locks whenever it closes. The deadbolt, the only part the inside key works, was never thrown.", "method", ["latch"]),
  clue("ring", "A clean circle on the blotter", "Dust outlines a round, heavy object that stood on Arun's desk until very recently. It is not in the room.", "method"),
  clue("uv-trail", "Wiped drops by the door", "Under UV, a line of wiped droplets runs from the desk to the study door and out onto the landing.", "opportunity"),
  clue("service-stairs", "Down the back way", "The trail crosses the landing and turns down the service stairs. Whoever carried something bloody avoided reception.", "opportunity"),
  clue("spare-key", "A damp key on a dry hook", "The spare study key hangs in its place, still wet. Someone used it tonight before the official discovery and put it back.", "context", [], ["anika"]),
  clue("audit-meeting", "An appointment, not a farewell", "Arun's diary: '20:50 — R. Bring ORIGINAL pension ledger. No more excuses.' The accounts wing matters now.", "opportunity", ["diary"], ["rohan"]),
  clue("cabinet-hint", "Her birthday, as always", "Arun noted that the cabinet combination is 'her birthday'. Whose, and what date?", "context", ["diary"]),
  clue("plaque", "Mallika Jayawardene, 14 March 1966", "The memorial plaque in reception gives the birthday of Arun's late wife: the fourteenth of March.", "context"),
  clue("cabinet-code", "One-four-zero-three", "Anika gave you the blue cabinet's combination outright: 1403, her mother's birthday.", "context", [], ["anika"], ["int-anika"]),
  clue("clean-tea", "The tea was harmless", "No sedative or poison in cup or pot. Malini's tea cannot explain a fatal blow.", "red_herring", ["tea"], ["malini"]),
  clue("oil-rag", "A stain that glows", "The rag in the generator room lights up under UV, but it is machine oil and brake cleaner. It has nothing to do with the study.", "red_herring"),
  clue("malini-alibi", "Two people at the generator", "The electrician's unbroken bodycam file keeps Malini in frame from 20:49 to 21:03.", "alibi", ["generator"], ["malini"]),
  clue("anika-alibi", "A witnessed call", "Anika is on camera at reception from 20:48 to 21:04 without a break.", "alibi", ["call"], ["anika"]),
  clue("went-up", "'I should go up and say sorry'", "A record shows someone entering the study before the official discovery: Anika ended her call at 21:04 meaning to go upstairs.", "contradiction", ["call", "recorder"], ["anika"]),
  clue("dev-alibi", "The photographer in his own frame", "Dev is reflected in the veranda mirror in every ten-second frame from 20:49 to 21:03, and the stair door behind him never opens.", "alibi", ["camera"], ["dev"]),
  clue("pension-trail", "The beneficiary behind the invoices", "Pension contributions were booked as linen bills to Hill Supply, whose sole director and signatory is Rohan Senanayake. Page 47 of the ledger is torn out.", "motive", ["ledger"], ["rohan"]),
  clue("scheduled-email", "An email without a sender present", "The 20:55 email was written and scheduled at 20:31. Nobody touched Rohan's keyboard between 20:46 and 21:06.", "contradiction", ["dispatch"], ["rohan"]),
  clue("no-torch", "The torch never left its charger", "The accounts office torch sits in its cradle by the door, fully charged, dust on the handle.", "contradiction", [], ["rohan"]),
  clue("weight-match", "The missing tea weight", "Arun's blood sits under the handle of the brass tea weight, and its dented corner fits the wound.", "method", ["weight"]),
  clue("weight-print", "A grip in the brass", "Powder raises a partial palm-and-finger grip on the weight. Its ridges agree with Rohan's elimination prints.", "contradiction", ["weight"], ["rohan"]),
  clue("linen-trace", "A cloth with two stories", "The hotel linen carries Arun's blood and green wool fibres. A fibre match supports other evidence but cannot name a wearer.", "opportunity", ["linen"]),
  clue("page-match", "The stolen page fits", "The torn edge fits the stub of page 47. In Arun's hand: 'Rohan — explain these transfers tonight', beside the Hill Supply reserve account number.", "motive", ["page", "ledger"], ["rohan"]),
  clue("page-print", "A thumb in blood", "A bloody thumbprint on page 47 matches Rohan's elimination print. He handled the page after the blow.", "contradiction", ["page"], ["rohan"]),
  clue("cancelled-sale", "The sale had already been cancelled", "Arun withdrew the hotel from sale that afternoon and put it in trust for Anika and the staff. Her supposed motive is gone.", "context", ["cancellation"], ["anika"]),
  clue("recording", "What the landing heard", "Dev's recorder kept running: footsteps from the service stairs at 20:52, a blow at 20:54, tearing paper and the latch at 20:57.", "method", ["recorder"]),
  clue("ash-fragment", "What the stove left", "A charred scrap of ruled ledger paper survives: '…han — explain these tra…'. The account number is gone.", "motive", ["ash"], ["rohan"]),
  // Testimony
  clue("letters", "A daughter protecting a memory", "Anika admits she has her mother's letters from the study drawer. She says she took them when she left at 20:42.", "context", [], ["anika"], ["int-anika"]),
  clue("letters-on-desk", "Letters by his elbow at 20:45", "Malini saw a ribbon-tied bundle of old letters on Arun's desk when she brought the tea, three minutes after Anika left.", "contradiction", [], ["anika", "malini"], ["int-malini"]),
  clue("missing-weight", "The weight was there at 20:45", "Malini saw the brass tea weight on the blotter when she delivered the tea. It was gone when the body was found.", "method", [], ["malini"], ["int-malini"]),
  clue("early-entry", "Five minutes nobody mentioned", "Anika let herself in with the spare key at 21:05, found her father dead, took the letters and let the door latch behind her. The weight was already gone.", "contradiction", [], ["anika"], ["int-anika"]),
  clue("summoned", "Rohan was sent for", "Arun called for Rohan and the original ledger at ten to nine, and Rohan got the message.", "opportunity", ["recorder"], ["rohan"], ["int-anika"]),
  clue("green-bundle", "A witness, not an identification", "At 21:03 Malini saw a green sleeve carry a linen bundle into the laundry. She saw no face, and her porters wear green too.", "opportunity", [], ["malini"], ["int-malini"]),
  clue("torch-story", "'I went to find a torch'", "Faced with the mail audit, Rohan now says he left his desk during the blackout to fetch a torch.", "contradiction", [], ["rohan"], ["int-rohan"]),
  clue("no-account", "Twenty minutes unaccounted for", "With the torch story gone too, Rohan cannot say where he was between 20:46 and 21:06.", "contradiction", [], ["rohan"], ["int-rohan"]),
  clue("loan-story", "'A temporary loan'", "Rohan admits Hill Supply is his and calls the pension transfers a loan Arun would not give him time to repay.", "motive", [], ["rohan"], ["int-rohan"]),
  clue("was-in-study", "'He was alive when I arrived'", "Rohan admits he went up to the study during the blackout.", "contradiction", [], ["rohan"], ["int-confrontation"]),
  clue("confession", "An admission tested against facts", "Rohan admits the blow. His account matches the scheduled email, the latch, the service stairs and the hidden bundle.", "contradiction", [], ["rohan"], ["int-confrontation"]),
  clue("reserve-account", "Where the money sleeps", "Rohan gave up the Hill Supply reserve account and its standing transfer. The bank can freeze it tonight.", "motive", [], ["rohan"], ["int-confrontation"]),
  // Events
  clue("burnt", "Smoke from the kitchen stove", "While Rohan was out of your sight, someone fed paper into the kitchen stove. Whatever lay under the laundry basket lining is gone.", "contradiction", [], ["rohan"]),
  clue("basket-return", "Straight to the basket", "The constable you posted watched Rohan walk directly to the laundry and lift the lining of one particular basket. It was already empty.", "contradiction", [], ["rohan"]),
  // Deductions
  clue("false-alibi", "The alibi was built in advance", "Rohan scheduled his 'proof' nineteen minutes before the meeting Arun had summoned him to. The email was written to cover an absence he already planned.", "contradiction", ["dispatch", "diary"], ["rohan"]),
  clue("weapon-from-desk", "The weapon came from the desk", "A heavy object stood on the blotter at 20:45 and was gone by 21:05. The killer used what was to hand and carried it away.", "method"),
  clue("one-left", "Three clocks, one gap", "Camera, call and bodycam account for Dev, Anika and Malini through the whole death window. Only Rohan is unaccounted for.", "opportunity", ["camera", "call", "generator"], ["rohan"]),
  clue("green-sleeve", "The sleeve and the fibres agree", "The bundle Malini saw is the linen from the basket, and the green fibres in it match what the carrier wore. It narrows the field; it does not name him.", "opportunity", ["linen"], ["rohan"]),
  clue("motive-proved", "Page 47 names him", "The ledger shows where the money went; the recovered page shows Arun had found out and meant to have it out with Rohan that night.", "motive", ["ledger", "page"], ["rohan"]),
  clue("burnt-proof", "Burning the page was an answer", "The only person who needed page 47 destroyed is the person the surviving scrap names. Rohan was out of sight when the stove was lit.", "motive", ["ash", "ledger"], ["rohan"]),
];

const deductionSpecs: Array<[string, string, string[]]> = [
  ["false-alibi", "Where was Rohan really at 20:55?", ["scheduled-email", "audit-meeting"]],
  ["weapon-from-desk", "What killed Arun, and where did it come from?", ["ring", "missing-weight"]],
  ["one-left", "Who has no clock to vouch for them?", ["anika-alibi", "malini-alibi", "dev-alibi"]],
  ["green-sleeve", "Who carried the bundle?", ["green-bundle", "linen-trace"]],
  ["motive-proved", "Why was page 47 worth taking?", ["pension-trail", "page-match"]],
  ["burnt-proof", "Why was page 47 worth burning?", ["pension-trail", "ash-fragment"]],
];

/* ───────────────────────── Evidence ───────────────────────── */

const doc = (lines: Array<string | [string, string, ...string[]]>): NonNullable<Evidence["document"]> => ({
  lines: lines.map((l) => (typeof l === "string" ? l : l[0])),
  key: lines.flatMap((l, line) => (typeof l === "string" ? [] : [{ line, note: l[1], clueIds: l.slice(2).map(id) }])),
});
const detail = (key: string, x: number, y: number, label: string, note: string, clueKeys: string[] = [], tool?: SearchTool) => ({ id: id(`detail-${key}`), x, y, label, note, clueIds: clueKeys.map(id), tool });

type ItemSpec = { key: string; name: string; type: Evidence["type"]; room: string; image: string; description: string; people?: string[]; times?: string[]; red?: boolean } & Pick<Evidence, "details" | "document" | "compare" | "lockedUntil" | "lockedText">;
const itemSpecs: ItemSpec[] = [
  { key: "report", name: "Medical examiner's preliminary report", type: "forensic", room: "study", image: IMG.evStatement, description: "A sealed preliminary report clipped to the scene log.", times: ["death"], document: doc([
    "PRELIMINARY — Dr S. Peiris, Judicial Medical Officer, Haputale",
    "Deceased: Arun Jayawardene, 58. Found 21:10 on the study floor beside the desk.",
    ["Cause: single blunt impact, left temple. Edge-patterned wound, 4 cm.", "One blow, from something heavy with a corner.", "death-window"],
    ["Estimated time of death 20:50–21:00 (temperature, lividity).", "Inside the blackout.", "death-window"],
    "Weather: heavy rain, 14°C. Windows closed.",
    "Elimination prints taken from all four persons present.",
  ]) },
  { key: "latch", name: "Study door lock", type: "physical", room: "study", image: IMG.evPrint, description: "The scene technician's close-up of the study door furniture. Look it over yourself.", details: [
    detail("spring", 32, 45, "Spring latch", "The bevelled latch snaps home whenever the door closes. No key needed to lock it from outside.", ["latch-truth"]),
    detail("bolt", 68, 62, "Deadbolt", "Retracted. The key inside the room only works this bolt, and nobody turned it.", ["latch-truth"]),
  ] },
  { key: "diary", name: "Arun's appointment diary", type: "document", room: "study", image: IMG.evRecords, description: "Open at today's page, a pen lying across it.", people: ["rohan"], times: ["meeting"], document: doc([
    "Thursday 12 November",
    "09:30 — Solicitor. Sign trust papers and post TODAY.",
    ["20:50 — R. Bring ORIGINAL pension ledger. No more excuses.", "An appointment with 'R', inside the death window.", "audit-meeting"],
    "21:15 — D.W. (press). Give him the bank letters.",
    ["Cabinet: her birthday, as always.", "A combination, if you can work out whose birthday.", "cabinet-hint"],
    "Order lamp wick. Roof tiles, east gable.",
  ]) },
  { key: "tea", name: "Tea tray and laboratory screen", type: "forensic", room: "kitchen", image: tea, description: "The last drink served to Arun, sealed with the laboratory screening sheet.", people: ["malini"], times: ["tea-time"], red: true, document: doc([
    "Sample K-1: black tea, cup, approx. 60 ml remaining.",
    "Sample K-2: pot, approx. 300 ml.",
    ["Benzodiazepines, opiates, organophosphates: NOT DETECTED.", "Nothing in the tea.", "clean-tea"],
    "Sugar: none. Milk: none.",
    "Cup rim: one lip print, the deceased's.",
  ]) },
  { key: "generator", name: "Electrician's bodycam file", type: "footage", room: "generator", image: IMG.evCctv, description: "The electrician's work camera, left on the bench with his signed statement.", people: ["malini"], times: ["blackout", "power"], document: doc([
    "BODYCAM — K. Bandara, electrician. One continuous file.",
    "20:47 Called down to the generator room.",
    ["20:49–21:03 Chef M. Fernando in frame throughout, holding the lantern.", "Malini is covered for the whole death window.", "malini-alibi"],
    "20:50 Mains fail: storm fault upstream. Generator will not start.",
    "21:02 Generator starts. Lights restored.",
    "21:03 Fernando leaves toward the kitchen corridor.",
  ]) },
  { key: "call", name: "Reception video-call recording", type: "digital", room: "reception", image: IMG.evPhone, description: "Saved by Anika's colleague in Kandy and handed to the duty officer.", people: ["anika"], times: ["call-time"], document: doc([
    "Video call — I. Rajapakse (Kandy) with A. Jayawardene. Saved by host.",
    "20:48 Call connects. A.J. at the reception desk, laptop on battery.",
    "20:50 Room behind her goes dark.",
    ["20:48–21:04 A.J. on camera without interruption.", "Anika is covered for the whole death window.", "anika-alibi"],
    ["21:04 A.J.: 'I should go up and say sorry before he sleeps.' Call ends.", "She meant to go upstairs six minutes before the body was 'found'.", "went-up"],
    "File hash verified by duty officer.",
  ]) },
  { key: "camera", name: "Veranda time-lapse card", type: "digital", room: "veranda", image: IMG.evCctvZoom, description: "The original card from Dev's tripod. One frame every ten seconds.", people: ["dev"], times: ["camera-time"], details: [
    detail("mirror", 70, 38, "The mirror behind the tripod", "Dev is reflected in every frame from 20:49:00 to 21:03:10. No frame is missing.", ["dev-alibi"]),
    detail("door", 24, 55, "The stair door in the reflection", "It stays shut through the entire sequence."),
  ] },
  { key: "ledger", name: "Pension trust ledger", type: "document", room: "archive", image: IMG.evRecords, description: "The original ledger from the blue cabinet, with a bank letter pinned inside the cover.", people: ["rohan", "malini"], times: ["audit"], document: doc([
    "RAINWOOD HOUSE — STAFF PENSION TRUST (original)",
    "p.44 March: contributions 412,000 to Trust account.",
    ["p.45 June: contributions 418,500 to 'Hill Supply (Pvt) — linen contract'.", "Pension money booked as a linen bill."],
    "Stationery note: rebind before year end.",
    ["Bank letter: Hill Supply (Pvt). Sole director and signatory: R. Senanayake.", "The 'supplier' is Rohan himself.", "pension-trail"],
    ["p.47 — torn out. Stub remains.", "Someone removed a page. The stub could be matched."],
  ]) },
  { key: "dispatch", name: "Mail server audit", type: "digital", room: "office", image: IMG.evPhoneZoom, description: "Exported from the desk computer: every event on Rohan's mail account tonight.", people: ["rohan"], times: ["schedule"], document: doc([
    "MAIL AUDIT — account r.senanayake",
    "19:58 Spam filter definitions updated.",
    ["20:31 Message created and scheduled to send at 20:55.", "The email was written 24 minutes before it 'left'.", "scheduled-email"],
    ["20:46 Last keyboard input until 21:06.", "Nobody was at this keyboard during the blackout.", "scheduled-email"],
    "20:55 Message dispatched by server.",
    "Mailbox quota 41% used.",
  ]) },
  { key: "weight", name: "Brass tea weight", type: "physical", room: "laundry", image: cover, description: "A heavy antique tea weight, wrapped in linen at the bottom of the basket.", people: ["rohan"], details: [
    detail("dent", 72, 34, "Dented corner", "An old dent, and the inventory tag still tied on: 'Study — desk'."),
    detail("blood", 44, 62, "Under the handle", "It glows. Blood and tissue packed into the casting seam: Arun's.", ["weight-match"], "uv"),
    detail("grip", 28, 40, "Polished shoulder", "A partial grip comes up in the powder: palm edge and two fingers.", ["weight-print"], "powder"),
  ] },
  { key: "linen", name: "Bloodstained hotel linen", type: "forensic", room: "laundry", image: IMG.evPrint, description: "A hotel tablecloth, bundled tight around something heavy.", details: [
    detail("fibres", 64, 58, "Caught in the weave", "Short green wool fibres, snagged where the cloth was clamped under an arm.", ["linen-trace"]),
    detail("stain", 38, 46, "Inner fold", "A wide transfer stain lights up: blood, typed to Arun.", ["linen-trace"], "uv"),
  ] },
  { key: "page", name: "Torn ledger page", type: "document", room: "laundry", image: IMG.evReceiptZoom, description: "A folded, stained page pushed under the basket lining.", people: ["rohan"],
    compare: [{ withEvidenceId: id("ledger"), note: "The tear fits the stub of page 47 fibre for fibre. In the margin, in Arun's hand: 'Rohan — explain these transfers tonight.'", clueIds: [id("page-match")] }],
    details: [detail("thumb", 62, 70, "Lower corner", "A thumbprint in blood develops clean: fourteen points against Rohan's elimination print.", ["page-print"], "powder")] },
  { key: "cancellation", name: "Letter to the solicitor", type: "document", room: "reception", image: IMG.evStatement, description: "Stamped and waiting in the outgoing post, dated this afternoon.", people: ["anika"], times: ["cancel"], red: true, document: doc([
    "To: Wickramasinghe & Co., Solicitors",
    ["Please withdraw Rainwood House from sale with immediate effect.", "The sale Anika was fighting had already been called off.", "cancelled-sale"],
    ["The property is to pass into trust for my daughter and the staff jointly.", "Nobody inherits outright.", "cancelled-sale"],
    "Kindly confirm receipt by post.",
    "— A. Jayawardene",
  ]) },
  { key: "recorder", name: "Voice recorder", type: "digital", room: "landing", image: IMG.evPhone, description: "A pocket recorder wedged behind the umbrella stand, still warm. Someone was listening at the study door.", people: ["dev"],
    lockedUntil: chose("dev-deal"), lockedText: "PIN-locked. Its owner could open it. Otherwise the technical unit will, some time after the road reopens.", document: doc([
    "REC 004 — started 20:36",
    ["20:38 Raised voices. A woman: 'You are erasing her!'", "The argument, as Anika described it."],
    ["20:44 Arun, on the telephone: 'Rohan. Ten to nine. The original ledger, not your copy.'", "Rohan was summoned.", "summoned"],
    "20:47 Rain on the landing window. A shutter bangs.",
    ["20:52 Slow footsteps from the service stairs. The study door.", "The visitor came up the back way.", "recording"],
    ["20:54 A man: 'Give me one more week—' A heavy blow. Something falls.", "The killing, to the minute.", "recording"],
    ["20:57 Paper tearing. The door closes; the latch clicks. Footsteps to the service stairs.", "The page, the latch, the escape route.", "recording"],
    ["21:05 A key in the lock. A woman's cry, cut short. The door closes again.", "Someone found him five minutes before anyone admitted it.", "went-up"],
  ]) },
  { key: "ash", name: "Charred paper from the stove", type: "physical", room: "kitchen", image: IMG.evReceipt, description: "Raked out of the kitchen stove, still warm. Most of it falls apart at a touch.", people: ["rohan"],
    compare: [{ withEvidenceId: id("ledger"), note: "Same ruled stock, same faint blue feint lines as the pension ledger. This was page 47.", clueIds: [id("ash-fragment")] }],
    details: [detail("words", 48, 52, "Surviving scrap", "Arun's handwriting, brown at the edges: '…han — explain these tra…'", ["ash-fragment"])] },
];
const roomOf: Record<string, string> = { study: "upper", landing: "upper", reception: "ground", veranda: "ground", kitchen: "service", generator: "service", laundry: "service", office: "accounts", archive: "accounts" };
const evidence: Evidence[] = itemSpecs.map(({ key, name, type, room, image, description, people = [], times = [], red, ...examine }, index) => ({
  id: id(key), code: `ML-E${String(index + 1).padStart(2, "0")}`, name, type, image, description,
  foundAtLocationId: id(roomOf[room]!), foundInSceneId: id(`scene-${room}`), discoveredBy: "Search the room",
  relatedSuspectIds: people.map(id), relatedTimelineIds: times.map(id),
  relatedClueIds: [...new Set([...(examine.details ?? []), ...(examine.document?.key ?? []), ...(examine.compare ?? [])].flatMap((x) => x.clueIds))],
  isKey: ["ledger", "dispatch", "weight", "page", "latch", "diary"].includes(key), isRedHerring: !!red, inspections: [], ...examine,
}));

/* ───────────────────────── Locations, rooms and what is hidden in them ───────────────────────── */

const accountsOpen = either(clueIf("audit-meeting"), clueIf("letters"));
const laundryOpen = either(clueIf("service-stairs"), clueIf("green-bundle"), clueIf("recording"));
const locations: CaseBundle["locations"] = [
  { key: "upper", name: "Upper floor", image: study, description: "The family's private rooms. The study door stands open now, a constable beside it." },
  { key: "ground", name: "Ground floor", image: IMG.sceneEntrance, description: "Reception and the long veranda, where four people are waiting for the road to clear." },
  { key: "service", name: "Service wing", image: IMG.sceneKitchen, description: "Kitchen, generator room and laundry, joined to the upper floor by a narrow back stair." },
  { key: "accounts", name: "Accounts wing", image: accounts, description: "Two converted guest rooms where the hotel's money is counted.", unlockCondition: accountsOpen },
].map(({ key, unlockCondition, ...l }) => ({ ...l, id: id(key), address: "Rainwood House Hotel, Haputale, Sri Lanka", unlockedByDefault: !unlockCondition, ...(unlockCondition && { unlockCondition }) }));

type Spot = { key: string; name: string; x: number; y: number; info: string; evidence?: string; clue?: string; tool?: SearchTool; parent?: string; lock?: Hotspot["lock"]; when?: ConditionGroup };
const room = (key: string, name: string, image: string, description: string, spots: Spot[], extra: Pick<Scene, "dark" | "unlockCondition"> = {}) => ({ key, name, image, description, spots, extra });
const rooms = [
  room("study", "Arun's study", study, "Rain taps the windows. The desk lamp is still burning. The body has been moved; the room has not.", [
    { key: "desk", name: "Writing desk", x: 48, y: 62, info: "Blotter, lamp, a diary lying open. Look closer." },
    { key: "diary", parent: "desk", name: "Appointment diary", x: 0, y: 0, info: "Open at today's page.", evidence: "diary" },
    { key: "ring", parent: "desk", name: "Mark on the blotter", x: 0, y: 0, info: "A clean circle in the dust, about the width of a saucer. Something heavy stood here, and recently.", clue: "ring" },
    { key: "door", name: "Study door", x: 86, y: 44, info: "Brass latch, separate deadbolt, key on the inside.", evidence: "latch" },
    { key: "log", name: "Scene log", x: 18, y: 72, info: "The first officer's clipboard, with a sealed report attached.", evidence: "report" },
    { key: "carpet", name: "Carpet by the door", x: 70, y: 84, info: "Nothing to the eye. Under the lamp, a string of wiped droplets shows up, leading out.", clue: "uv-trail", tool: "uv" },
  ]),
  room("landing", "Upper landing", IMG.sceneLiving, "The bulb blew when the power came back. Main stairs to reception on one side, the narrow service stair on the other.", [
    { key: "stand", name: "Umbrella stand", x: 24, y: 70, info: "Behind the wet umbrellas, something small and warm.", evidence: "recorder" },
    { key: "banister", name: "Service stair rail", x: 64, y: 56, info: "The trail picks up again on the rail and goes down the service stairs.", clue: "service-stairs", tool: "uv" },
    { key: "hook", name: "Key hooks", x: 82, y: 32, info: "'Study — spare'. The key is on its hook, and it is wet.", clue: "spare-key" },
  ], { dark: true }),
  room("reception", "Reception", IMG.sceneEntrance, "A cold fireplace, the front desk, tonight's post waiting for a van that will not come.", [
    { key: "post", name: "Outgoing post tray", x: 30, y: 60, info: "Three bills and one hand-addressed envelope." },
    { key: "letter", parent: "post", name: "Envelope to the solicitor", x: 0, y: 0, info: "Arun's handwriting. Sealed this afternoon.", evidence: "cancellation" },
    { key: "folder", name: "Duty officer's folder", x: 62, y: 58, info: "A memory stick taped to a statement form.", evidence: "call" },
    { key: "plaque", name: "Brass plaque", x: 78, y: 24, info: "'In memory of Mallika Jayawardene, born 14 March 1966, who made this house a home.'", clue: "plaque" },
  ]),
  room("veranda", "Covered veranda", cover, "Rain sheets off the roof. A tripod still faces the valley.", [
    { key: "tripod", name: "Tripod and camera", x: 46, y: 56, info: "The card door is open. The original card is still inside.", evidence: "camera" },
  ], { dark: true }),
  room("kitchen", "Kitchen", IMG.sceneKitchen, "Scrubbed steel and a wood stove that never quite goes out.", [
    { key: "tray", name: "Sealed tea tray", x: 38, y: 60, info: "Bagged and tagged, with the lab's screening sheet.", evidence: "tea" },
    { key: "stove-cold", name: "Wood stove", x: 76, y: 50, info: "Banked low. Nothing in the firebox but clean ash and kindling.", when: not(burnt) },
    { key: "stove", name: "Wood stove", x: 76, y: 50, info: "The firebox door is ajar and the fire has been fed. Paper ash, still holding its shape.", evidence: "ash", when: burnt },
  ]),
  room("generator", "Generator room", IMG.sceneParking, "Diesel, damp concrete, and a lantern nobody has turned off.", [
    { key: "bench", name: "Workbench", x: 34, y: 60, info: "The electrician's bodycam and a signed statement.", evidence: "generator" },
    { key: "rag", name: "Stained rag", x: 70, y: 76, info: "It blazes under the lamp. Sniff it: machine oil and brake cleaner.", clue: "oil-rag", tool: "uv" },
  ], { dark: true }),
  room("laundry", "Laundry corridor", laundry, "The back stair comes out here. One basket has been shoved behind the trolley.", [
    { key: "basket", name: "Wicker basket", x: 44, y: 66, info: "Heavier than a basket of linen should be." },
    { key: "bundle", parent: "basket", name: "Knotted tablecloth", x: 0, y: 0, info: "Stained, and tied around something solid.", evidence: "linen" },
    { key: "weight", parent: "bundle", name: "Something brass", x: 0, y: 0, info: "A tea weight, the size of a saucer.", evidence: "weight" },
    { key: "lining", parent: "basket", name: "Basket lining", x: 0, y: 0, info: "The canvas lining has been lifted and pressed back." },
    { key: "page", parent: "lining", name: "Folded paper", x: 0, y: 0, info: "A ledger page, folded in four, stained at one corner.", evidence: "page", when: not(burnt) },
  ], { unlockCondition: laundryOpen }),
  room("office", "Accounts office", accounts, "Rohan's desk. Everything squared to the edge. The computer is still on.", [
    { key: "computer", name: "Desk computer", x: 54, y: 50, info: "The mail client is open. The duty officer has exported the server audit.", evidence: "dispatch" },
    { key: "torch", name: "Torch charger", x: 16, y: 44, info: "The office torch, in its cradle by the door. Full charge. Dust on the handle.", clue: "no-torch" },
  ]),
  room("archive", "Records room", IMG.sceneOffice, "Shelves of box files and one blue steel cabinet with a combination dial.", [
    { key: "cabinet", name: "Blue cabinet", x: 52, y: 54, info: "The original books are kept here.", lock: { code: "1403", prompt: "Four digits. A brass tag on the handle reads: 'Hers, as always.'" } },
    { key: "ledger", parent: "cabinet", name: "Pension ledger", x: 0, y: 0, info: "Green cloth, a bank letter pinned inside the cover.", evidence: "ledger" },
  ]),
];
const scenes: Scene[] = rooms.map(({ key, name, image, description, spots, extra }, index) => ({
  id: id(`scene-${key}`), name, locationId: id(roomOf[key]!), image, description, order: index + 1, ...extra,
  hotspots: spots.map((sp): Hotspot => ({
    id: id(`spot-${sp.key}`), name: sp.name, type: sp.evidence ? "evidence" : "inspect", description: sp.info, x: sp.x, y: sp.y, radius: 9,
    initialInfo: sp.info, detailedInfo: "", evidenceId: sp.evidence && id(sp.evidence), clueId: sp.clue && id(sp.clue), tool: sp.tool,
    parentId: sp.parent && id(`spot-${sp.parent}`), lock: sp.lock, unlockCondition: sp.when, discoveryState: sp.when ? "hidden" : "visible", extraImages: [],
  })),
}));

/* ───────────────────────── Interrogations ───────────────────────── */

type ReplySpec = Omit<StatementReply, "clueIds"> & { clues?: string[] };
type StatementSpec = Omit<Statement, "press" | "exposed" | "choices" | "contradictedBy" | "doubt" | "ask" | "tell"> & { press?: ReplySpec & { question: string }; exposed?: ReplySpec; doubt?: ReplySpec; by?: string[]; choices?: Array<ReplySpec & Pick<StatementChoice, "id" | "label">> };
const say = <T extends ReplySpec>({ clues: keys, ...r }: T) => ({ ...r, ...(keys && { clueIds: keys.map(id) }) });
function talkBase(key: string, person: string, title: string, opening: string, rebuff: string, testimony: StatementSpec[], unlockCondition?: ConditionGroup): Interview {
  return {
    id: id(`int-${key}`), code: `ML-I${key.toUpperCase()}`, title, suspectId: id(person), locationId: id("ground"), description: opening, opening, rebuff,
    unlockedByDefault: !unlockCondition, unlockCondition, nodes: [], edges: [],
    testimony: testimony.map(({ press, exposed, doubt, by, choices, ...st }) => ({
      ...st, id: id(`st-${key}-${st.id}`), ask: notebook[`${key}-${st.id}`]![0], tell: { emotion: notebook[`${key}-${st.id}`]![1], text: notebook[`${key}-${st.id}`]![2] },
      ...(press && { press: say(press) }), ...(exposed && { exposed: say(exposed) }), ...(doubt && { doubt: say(doubt) }), ...(by && { contradictedBy: by.map(id) }),
      ...(choices && { choices: choices.map((c) => ({ ...say(c), id: id(c.id) })) }),
    })),
  };
}

/** The detective's question for each statement, and what the player sees in the face across the table: [question, expression, tell]. */
const notebook: Record<string, [string, NonNullable<StatementReply["emotion"]>, string]> = {
  "anika-argument": ["Tell me about the argument with your father.", "sad", "She answers quickly, eyes on yours, turning a ring round and round on her finger."],
  "anika-letters": ["What did you take from the study?", "nervous", "Her gaze slides to the staircase before she has finished the sentence."],
  "anika-call": ["Where were you when the lights went out?", "calm", "A level voice. She does not look away."],
  "anika-meeting": ["Who is the 'R' in his diary?", "calm", "She answers at once, almost glad to be asked something simple."],
  "anika-sale": ["Did you know the sale had been cancelled?", "sad", "Her face empties. She sits down without meaning to."],
  "anika-saw": ["What did you see when you went in?", "sad", "She speaks slowly, looking at her own hands."],
  "rohan-desk": ["Where were you between 20:50 and 21:00?", "calm", "A small, patient smile. He squares a pen against the edge of the desk."],
  "rohan-torch": ["Where did you go when you left your desk?", "nervous", "He touches his glasses twice. The answer comes a beat late."],
  "rohan-pensions": ["Why are the staff pension contributions missing?", "defensive", "He sighs like a man explaining arithmetic to a child, and does not blink."],
  "rohan-summons": ["Arun's diary has you upstairs at 20:50.", "calm", "He looks at the diary, not at you."],
  "malini-threat": ["What did you threaten Arun with?", "angry", "Arms folded. She dares you to make something of it."],
  "malini-tea": ["Tell me about the tea you took up.", "calm", "Plain and unhurried, like reading out an order."],
  "malini-generator": ["Where were you during the blackout?", "calm", "She shrugs. It is not a question that worries her."],
  "malini-corridor": ["Who did you pass on your way back?", "nervous", "She wipes her hands on her apron, though they are dry, and glances toward the kitchen boys."],
  "malini-weight": ["Do you recognise this?", "sad", "She reaches for it, then draws her hand back."],
  "dev-invite": ["Why are you at Rainwood House tonight?", "nervous", "He fidgets with a lens cap. He is not used to being the one questioned."],
  "dev-upstairs": ["Have you been upstairs tonight?", "calm", "An easy grin. Just a little too easy."],
  "dev-veranda": ["Where were you during the blackout?", "calm", "He waves a hand at the veranda without a pause."],
  "dev-advice": ["In my place, what would you look at?", "relieved", "He leans back, pleased to be asked."],
  "confrontation-stairs": ["You left your desk. Where did you go?", "defensive", "He holds very still. A pulse shows at his temple."],
  "confrontation-alive": ["What happened in that room?", "nervous", "His eyes go to the door, and stay there."],
};


/** A readable map of an interrogation for the editor: each statement, the three ways to read it, what each reveals and where it leads. The game plays from `testimony`; this is its diagram. */
function graphOf(key: string, person: string, opening: string, testimony: Statement[]): Pick<Interview, "nodes" | "edges"> {
  const who = suspects.find((s) => s.id === id(person))!.name;
  const pre = id(`gx-${key}`);
  const nodes: DialogueNode[] = [];
  const edges: Interview["edges"] = [];
  const add = (nid: string, n: Omit<DialogueNode, "id">) => { nodes.push({ id: nid, ...n }); return nid; };
  const link = (source: string, target: string, label?: string, eid?: string) => { edges.push({ id: eid ?? `${pre}-e${edges.length}`, source, target, ...(label && { label }) }); };
  const start = add(`${pre}-start`, { type: "start", text: "Interrogation begins", position: { x: 0, y: 0 } });
  const open = add(`${pre}-open`, { type: "response", speaker: who, text: opening, position: { x: 0, y: 120 } });
  const menu = add(`${pre}-menu`, { type: "choice", text: "Your notebook: pick a question", position: { x: 0, y: 240 } });
  link(start, open); link(open, menu);
  const leaves: string[] = [];
  const lastX = Math.max(0, testimony.length - 1) * 420;

  testimony.forEach((st, i) => {
    const x = i * 420, sx = x + 210;
    const q = add(st.id, { type: "question", speaker: "Detective", text: st.ask ?? st.text, position: { x, y: 380 }, ...(st.condition && { condition: st.condition }) });
    link(menu, q, st.ask);
    const say = add(`${st.id}-say`, { type: "response", speaker: who, text: st.text, position: { x, y: 500 }, ...(st.tell && { reaction: { emotion: st.tell.emotion, intensity: 1 as const } }) });
    link(q, say);
    // a reply and the notes it files, as a chain. Returns where the chain ends and the next free row.
    const reply = (from: string, label: string, r: StatementReply, k: string, rx: number, ry: number, caught = false, eid?: string) => {
      let tail = add(`${st.id}-${k}`, { type: "response", speaker: who, text: r.text, position: { x: rx, y: ry }, reaction: { emotion: r.emotion ?? "calm", intensity: caught ? 3 : 1 }, ...(caught && { isContradiction: true }) });
      link(from, tail, label, eid);
      (r.clueIds ?? []).forEach((cid, n) => {
        const c = add(`${st.id}-${k}-note${n}`, { type: "clue", text: `Note: ${clues.find((x) => x.id === cid)?.title ?? cid}`, clueId: cid, position: { x: rx, y: ry + 120 * (n + 1) } });
        link(tail, c); tail = c;
      });
      return { tail, next: ry + 120 * ((r.clueIds?.length ?? 0) + 1) };
    };
    // the one-time decision that follows a resolved statement
    const decide = (from: string, rx: number, ry: number) => {
      if (!st.choices?.length) return void leaves.push(from);
      const pick = add(`${st.id}-call`, { type: "choice", text: "Your call (permanent)", position: { x: rx, y: ry } });
      link(from, pick);
      st.choices.forEach((c, n) => leaves.push(reply(pick, c.label, c, `reply${n}`, rx + (n - (st.choices!.length - 1) / 2) * 210, ry + 120, false, c.id).tail));
    };

    const lie = !!st.contradictedBy?.length;
    if (st.press) { // taking it at face value
      const r = reply(say, lie || st.doubt ? "Truth (wrong call)" : "Truth", st.press, "press", x, 640);
      if (lie || st.doubt) leaves.push(r.tail); else decide(r.tail, x, r.next);
    } else if (!lie && !st.doubt) {
      if (st.choices?.length) decide(say, x, 640); else link(say, menu, "Truth");
    }
    if (lie && st.exposed) {
      const ev = st.contradictedBy!.find((c) => evidence.some((e) => e.id === c));
      let from = say, label = "Lie";
      if (ev) {
        from = add(`${st.id}-present`, { type: "present_evidence", text: `Prove it: ${evidence.find((e) => e.id === ev)!.name}`, evidenceId: ev, position: { x: sx, y: 640 } });
        link(say, from, "Lie"); label = "";
      }
      const r = reply(from, label, st.exposed, "exposed", sx, ev ? 780 : 640, true);
      decide(r.tail, sx, r.next);
    } else if (st.doubt) {
      const r = reply(say, "Doubt", st.doubt, "doubt", sx, 640);
      decide(r.tail, sx, r.next);
    }
  });

  const end = add(`${pre}-end`, { type: "end", text: "Leave the room", position: { x: lastX / 2, y: 1500 } });
  leaves.forEach((l) => link(l, menu));
  link(menu, end, "Leave");
  return { nodes, edges };
}

/** Builds an interrogation and the editor graph that mirrors it. */
const talk = (...args: Parameters<typeof talkBase>): Interview => {
  const iv = talkBase(...args);
  return { ...iv, ...graphOf(args[0], args[1], args[3], iv.testimony!) };
};

const interviews: Interview[] = [
  talk("anika", "anika", "Anika Jayawardene", "If you want the truth, ask me about my father. Don't ask me what his house is worth.", "That has nothing to do with what I told you. Are you guessing, Inspector?", [
    { id: "argument", text: "We argued about the sale. I left his study at 20:42 and I did not go back.",
      press: { question: "What was said?", text: "He said there would be changes. I thought he meant selling. I told him he was erasing my mother. Those were the last words he heard from me.", emotion: "sad" },
      choices: [
        { id: "anika-trust", label: "What did this place mean to your mother?", text: "She wanted the staff to own a share of it one day. Her letters were in his drawer. I have them now; that is what I have been hiding. If you need the accounts, they are in the blue cabinet in the records room. The combination is her birthday. One-four-zero-three.", clues: ["letters", "cabinet-code"], emotion: "sad" },
        { id: "anika-pressured", label: "Spare me the grief. What did you take from that room?", text: "Letters. My mother's. Not a ledger and not a rupee. And since you ask like that, you can find your own way into his cabinets.", clues: ["letters"], emotion: "angry" },
      ] },
    { id: "letters", condition: clueIf("letters"), text: "I took my mother's letters with me when I walked out at 20:42. Nothing else left that room with me.",
      press: { question: "Where were they kept?", text: "The top drawer. Tied with her ribbon. He read them when he couldn't sleep.", emotion: "sad" },
      by: ["letters-on-desk", "went-up"],
      exposed: { text: "…All right. I went back up at 21:05, when the call ended. I used the spare key. He was on the floor by the desk. The letters were beside his hand. I took them, I let the door close, and I stood on the landing until I could breathe. Then I fetched Malini and we 'found' him together.", clues: ["early-entry"], emotion: "sad" },
      choices: [
        { id: "anika-shielded", label: "That stays in my notebook. Not the report.", text: "Thank you. I know what that costs you. Ask me anything about what I saw.", emotion: "relieved" },
        { id: "anika-reported", label: "You disturbed a scene. It goes in the report.", text: "Then write it down properly. I would rather be charged with that than have you think it was me.", emotion: "defensive" },
      ] },
    { id: "call", text: "From 20:48 until the lights came back I was on a video call at the reception desk.",
      press: { question: "Who can confirm it?", text: "Isha, my colleague in Kandy. She saved the whole call. The duty officer has it." } },
    { id: "meeting", condition: clueIf("audit-meeting"), text: "The 'R' in his diary is Rohan. Father asked me to send him up with the original ledger.",
      press: { question: "Did you pass the message on?", text: "At 20:43, at the door of the accounts office. Rohan said he needed ten minutes to finish something first.", clues: ["summoned"] } },
    { id: "sale", condition: when("evidence_discovered", "cancellation"), text: "He never told me he had cancelled the sale. We were fighting about something he had already undone.",
      press: { question: "Who else knew?", text: "His solicitor. And Rohan would have had to prepare the trust accounts. Nobody else.", emotion: "sad" } },
    { id: "saw", condition: clueIf("early-entry"), text: "When I went in at 21:05 the desk lamp was on, the diary was open, and the brass tea weight was gone from the blotter.",
      press: { question: "And the door?", text: "The latch had caught by itself; it always does. The deadbolt was not turned. I did not touch it." } },
  ]),
  talk("rohan", "rohan", "Rohan Senanayake", "A dreadful accident. Arun kept late hours and steep stairs. I am happy to provide any record you need.", "I fail to see the relevance. Shall we keep to facts?", [
    { id: "desk", text: "I was at my desk in the accounts office all evening. My 20:55 email to the linen supplier proves it.",
      press: { question: "Did anyone see you send it?", text: "No. I work alone. But a timestamp is better than anyone's memory, wouldn't you say?", emotion: "calm" },
      by: ["scheduled-email", "false-alibi", "dispatch"],
      exposed: { text: "I schedule routine messages; any competent manager does. Very well: I stepped out when the lights failed. To find a torch. That does not make me a murderer. Now, if you'll excuse me, I should telephone my wife. Five minutes.", clues: ["torch-story"], emotion: "nervous" },
      choices: [
        { id: "rohan-released", label: "Five minutes. A constable will see you out.", text: "You are very kind. I shan't be long.", emotion: "relieved" },
        { id: "rohan-held", label: "Use the telephone on this desk. You stay where I can see you.", text: "As you wish. I have nothing to hide from you, Inspector.", emotion: "defensive" },
      ] },
    { id: "torch", condition: clueIf("torch-story"), text: "During the blackout I fetched the torch from the accounts office and waited in the corridor.",
      press: { question: "Which torch?", text: "The office one. On the charger by the door. I had it in my hand the whole time.", emotion: "nervous" },
      by: ["no-torch"],
      exposed: { text: "Then I am mistaken about the torch. It was dark. I do not recall exactly where I stood, and I will not guess to please you.", clues: ["no-account"], emotion: "defensive" } },
    { id: "pensions", text: "The pension shortfall is a reconciliation delay. Arun never understood the difference between a transfer and a posting.",
      press: { question: "When would it have reconciled?", text: "By year end. I was going to walk him through it in the morning.", emotion: "calm" },
      by: ["pension-trail", "ledger", "motive-proved"],
      exposed: { text: "Hill Supply is mine. It was a loan, a temporary one, against a bad year. Arun called it theft and would not give me a week to put it back.", clues: ["loan-story"], emotion: "angry" } },
    { id: "summons", condition: clueIf("audit-meeting"), text: "Arun wrote appointments in that diary without telling anyone. Nobody asked me to go upstairs tonight.",
      press: { question: "You never heard from him?", text: "Not a word after five o'clock.", emotion: "calm" },
      by: ["summoned"],
      exposed: { text: "Yes, the message reached me. I chose not to go. One does not argue accounts in the dark.", emotion: "defensive" } },
  ]),
  talk("malini", "malini", "Malini Fernando", "I made his tea. I also told him I would go to the police. Both things are true.", "That is not what I said, and that does not answer it. Try again.", [
    { id: "threat", text: "I told Arun that if the pensions were not put right, I would walk all eighteen of us into the labour office.",
      press: { question: "Did you think he had taken the money?", text: "He signed the payslips. But Arun could not hide a birthday present. If money was moved quietly, somebody cleverer moved it." } },
    { id: "tea", text: "I took up his tea at 20:45. He was alive, at his desk, writing in his diary.",
      press: { question: "What was on the desk?", text: "The diary. A bundle of old letters tied with ribbon, by his elbow. And that brass tea weight he used on his papers, on the blotter where it always sat. He said, 'You'll have an answer tomorrow, Malini.'", clues: ["letters-on-desk", "missing-weight"] } },
    { id: "generator", text: "When the lights went I was in the generator room with the electrician, holding his lantern, until 21:03.",
      press: { question: "Can he confirm it?", text: "His camera was running on his chest the whole time. Ask it." } },
    { id: "corridor", text: "I came back along the service corridor to the kitchen. I saw nobody.",
      press: { question: "Nobody at all?", text: "It was dark. I had dinner for forty to rescue.", emotion: "defensive" },
      doubt: { text: "…A green sleeve. Someone turning into the laundry with a bundle of linen under the arm, at 21:03. No face. My porters wear green jackets, Inspector, and I will not hang a boy on the colour of a sleeve. Look in the baskets before you put a name to it.", clues: ["green-bundle"], emotion: "nervous" } },
    { id: "weight", condition: clueIf("weight-match"), text: "That is Arun's tea weight. The dent in the corner has been there since his father dropped it.",
      press: { question: "You are certain?", text: "I have dusted around it for twenty years. But let your laboratory say so, not me." } },
  ]),
  talk("dev", "dev", "Dev Wijesinghe", "Arun asked me here. A dead source is not the story I came for.", "Nice try. That proves nothing about what I just said.", [
    { id: "invite", text: "Arun invited me. He was going to hand me bank letters at 21:15.",
      press: { question: "Can you show that without naming a source?", text: "The message is from Arun's own number: '21:15, after I have spoken to Rohan.' That is all you get." } },
    { id: "upstairs", text: "I have not been upstairs tonight. I checked in, I went to the veranda, I stayed there.",
      press: { question: "Not even to find Arun?", text: "We had an appointment. I can wait.", emotion: "nervous" },
      by: ["recorder"],
      exposed: { text: "Fine. I recorded the row from the landing, before 20:42. Shabby, I know. I left the recorder behind the umbrellas to pick up later, and I left it running. It is PIN-locked. So here is my offer: I open it for you, and I read that ledger before anyone else does.", emotion: "nervous" },
      choices: [
        { id: "dev-deal", label: "Agreed. Open it and you see the ledger first.", text: "Two-nine-one-one. Listen to the part after everyone thought the landing was empty.", emotion: "relieved" },
        { id: "dev-nodeal", label: "No trade. It is evidence; the technical unit will open it.", text: "After the road reopens, and after a magistrate signs for it. Your choice, Inspector.", emotion: "defensive" },
      ] },
    { id: "veranda", text: "Through the blackout I was on the veranda, photographing the storm.",
      press: { question: "Can anything confirm it?", text: "The card is still in the camera. Ten-second intervals. There is a mirror behind the tripod; you will find me in it." } },
    { id: "advice", condition: clueIf("dev-alibi"), text: "If I were you I would stop asking who shouted and start asking when things were written.",
      press: { question: "Meaning?", text: "An email tells you when a server sent it. It does not tell you who was sitting at the keyboard." } },
  ]),
  talk("confrontation", "rohan", "Rohan · the missing page", "You have been round the whole house, Inspector. I assume you finally have something concrete.", "Is that all? I expected better of you.", [
    { id: "stairs", text: "I left my desk during the blackout, yes. I never climbed those stairs.",
      press: { question: "Then where did you go?", text: "The corridor. I have told you. It was dark.", emotion: "defensive" },
      by: ["page-print", "weight-print", "basket-return"],
      exposed: { text: "…He telephoned. I went up the back stair with the ledger. He was alive when I arrived, I swear to you. We talked.", clues: ["was-in-study"], emotion: "nervous" } },
    { id: "alive", condition: clueIf("was-in-study"), text: "We talked about the accounts and I left him alive at his desk.",
      press: { question: "What did he say?", text: "That he would give the bank letters to the journalist at a quarter past nine. That it was out of his hands.", emotion: "nervous" },
      by: ["weight-match", "weight-print", "page-print", "linen-trace", "recording"],
      exposed: { text: "He had the page in his hand. He would not give me a week. The weight was on the blotter and then it was in my hand, and then the room was very quiet.", clues: ["confession"], emotion: "sad" },
      choices: [
        { id: "rohan-compassion", label: "Eighteen families, Rohan. Tell me where their money is.", text: "Hill Supply's reserve account. The number was on page 47; I can write it out for you. There is a standing transfer at nine tomorrow morning. Freeze it before then. I meant to put it back.", clues: ["reserve-account"], emotion: "sad" },
        { id: "rohan-challenge", label: "That was not panic. Take me through every step.", text: "I scheduled the email before I went up. After, I tore out the page, wrapped the weight in a tablecloth and pulled the door until the latch caught. Down the back stair. Into the basket when the lights came on. There was nobody else in that room.", emotion: "defensive" },
      ] },
  ], clueIf("false-alibi", "weight-match", "pension-trail")),
];

const timeline: CaseBundle["timeline"] = [
  ["cancel", "16:30", "Arun cancels the sale", "The signed instruction establishes a staff-and-family trust instead.", "reception", ["anika"], ["cancellation"], "discoverable"],
  ["audit", "19:40", "Arun checks the pension transfers", "He prepares the original ledger and attached bank confirmations for the evening meeting.", "accounts", ["rohan"], ["ledger"], "discoverable"],
  ["schedule", "20:31", "The supplier email is scheduled", "The server audit records Rohan's account scheduling a message for 20:55.", "accounts", ["rohan"], ["dispatch"], "discoverable"],
  ["tea-time", "20:45", "Malini delivers tea", "Arun is alive and writing at his desk.", "study", ["malini"], ["tea"], "discoverable"],
  ["call-time", "20:48", "Anika begins her recorded call", "She stays visible at reception until 21:04.", "reception", ["anika"], ["call"], "discoverable"],
  ["camera-time", "20:49", "Dev's continuous interval sequence begins", "The mirror records him and the stair entrance through 21:03.", "veranda", ["dev"], ["camera"], "discoverable"],
  ["blackout", "20:50", "Power fails", "A storm fault causes the outage. Malini is at the generator with the electrician.", "kitchen", ["malini"], ["generator"], "discoverable"],
  ["meeting", "20:50", "The diary's scheduled audit meeting", "Arun expected Rohan with the original ledger. This records an appointment, not proof of attendance.", "study", ["rohan"], ["diary"], "discoverable"],
  ["death", "20:50–21:00", "The medical death window", "A single blunt impact kills Arun within the medical examiner's estimated window; the exact minute is reconstructed only at the reveal.", "study", [], ["report"], "discoverable"],
  ["power", "21:02", "The lights return", "The generator recording and building log agree.", "kitchen", ["malini"], ["generator"], "discoverable"],
  ["discovery", "21:10", "The study is opened", "Anika and Malini fetch the spare latch key after repeated knocking. Arun is found dead, the separate deadbolt unused.", "study", ["anika", "malini"], [], "visible"],
].map(([key, time, title, description, location, people, items, visibility], order) => ({
  id: id(key as string), time: time as string, title: title as string, description: description as string, locationId: id(location as string),
  characterIds: (people as string[]).map(id), evidenceIds: (items as string[]).map(id), source: "Verified record or attributed witness account", correctOrder: order + 1, visibility: visibility as "visible" | "discoverable", isClaim: false, isTrue: true,
}));

const requiredEvidenceIds = ["ledger", "dispatch", "weight", "latch", "diary"].map(id);
const released = chose("rohan-released");
const notice = (key: string, label: string) => ({ id: id(`notice-${key}`), kind: "show_notification" as const, targetId: "", label });
export const monsoonLedger: CaseBundle = {
  endings: {
    solved: { title: "The missing page restored", text: "Your case joins motive, opportunity and method, and Rohan has no answer left. Read the reconstruction to close the file." },
    incomplete: { title: "A name is not the whole case", text: "You named the right man, but the case you put to him had a hole in it, and he walked through it. He is charged with false accounting. The murder file stays open on your desk." },
    incorrect: { title: "The wrong door", text: "The duty officer checks your accusation against the independent records and cannot support it. A secret is not proof of murder. Your discoveries are preserved; the investigation continues." },
  },
  storyEndings: [
    { id: id("end-front-page"), outcome: "solved", condition: chose("dev-deal"), title: "Front page", text: "Rohan is charged with murder. But Dev had his look at the ledger, and his story ran at dawn. By the time the court order reached the bank, a co-signatory had emptied the Hill Supply reserve. The staff of Rainwood House read about their pensions in the newspaper, and that is the only place they will ever see them." },
    { id: id("end-bought-back"), outcome: "solved", condition: all(burnt, clueIf("reserve-account")), title: "A confession buys back a pension", text: "Page 47 went up the kitchen chimney while Rohan was out of your sight. But you asked him about the families instead of the blow, and he wrote the account number out himself. The bank freezes the reserve at 08:40, twenty minutes before the standing transfer. Rohan is charged with murder; the pensions come home." },
    { id: id("end-ashes"), outcome: "solved", condition: burnt, title: "Ashes in the stove", text: "Rohan is charged with murder on the weapon, the grip in the brass and his own account. But page 47 burned while he was out of your sight, and with it the only record of where the money went. The standing transfer runs at nine. Malini tells the staff herself." },
    { id: id("end-restored"), outcome: "solved", title: "The missing page restored", text: "Motive, opportunity and method, each answered from the record. Page 47 goes to the bank with a court order and the reserve account is frozen before the morning transfer. At Rainwood House the staff finally read the books that held their future." },
  ],
  epilogues: [
    { condition: chose("anika-reported"), text: "Anika accepts a caution for disturbing the scene. She signs the trust deed anyway, with Malini as co-trustee." },
    { condition: chose("anika-shielded"), text: "Your notebook keeps one page to itself. Anika opens the hotel again in the spring; a ribbon-tied bundle of letters sits in the study drawer where it always did." },
    { condition: clueIf("basket-return"), text: "The constable's statement, that Rohan walked straight to one basket in a corridor of twelve, is read out twice at the committal." },
  ],
  deductions: deductionSpecs.map(([key, question, keys]) => ({ id: id(`deduce-${key}`), question, clueIds: keys.map(id), conclusionClueId: id(key) })),
  case: {
    id: "case-monsoon-ledger", code: "CASE-007", title: "The Monsoon Ledger", tagline: "Four suspects. One missing page. A door that tells a lie.",
    description: "A hotel owner dies during a monsoon blackout. Search nine rooms by torch and UV lamp, break four accounts of the evening, and decide who to trust. Your choices change what survives to be found, and how it ends.",
    story: "At 21:10, on a rainbound November night, Arun Jayawardene is found dead in the locked study of Rainwood House Hotel. A fallen tree has closed the hill road. His daughter says he was about to sell the hotel. His chef says the staff pensions have vanished. His financial manager has a timestamped alibi. A journalist was waiting for a meeting that never happened. You arrive with a torch, a UV lamp and a fingerprint kit. Nothing in this house is labelled for you: search the rooms, read the records for the line that matters, and catch each of them in the thing they are not saying. Be careful what you promise, and whom you let out of your sight.",
    type: "Murder Mystery", difficulty: "hard", status: "published", version: "2.2",
    versions: [{ version: "2.2", createdAt, author: "MysteryCase", summary: "Interrogation graphs for the editor; UV beam and powder brushing replace tool toggles." }, { version: "2.1", createdAt, author: "MysteryCase", summary: "Interrogations reworked: ask from the notebook, read the face, call Truth, Doubt or Lie." }, { version: "2.0", createdAt, author: "MysteryCase", summary: "Rebuilt as a full investigation: nine searchable rooms, hands-on evidence, press-and-challenge interrogations, a deduction board and four endings." }, { version: "1.0", createdAt, author: "MysteryCase", summary: "First illustrated release." }],
    coverImage: cover, estimatedMinutes: [50, 80], location: "Haputale, Sri Lanka", incidentDate: "2026-11-12", tags: ["monsoon", "hotel", "locked-room", "financial-secret", "branching-story"],
    victim: { name: "Arun Jayawardene", age: 58, occupation: "Owner of Rainwood House Hotel", description: "A widower preparing to put the hotel into a trust. Found beside his desk with a fatal head injury." },
    objectives: ["Search every room. Some things only show under UV or powder.", "Catch each suspect in what they are hiding.", "Link your clues to answer the open questions.", "Accuse, and beat every objection."],
    createdBy: "MysteryCase", createdAt, updatedAt: createdAt, publishedAt: createdAt, visibility: "public",
    stats: { players: 0, completions: 0, completionRate: 0, avgScore: 0, rating: 0 },
  },
  suspects, locations, scenes, evidence, interviews, clues, timeline,
  documents: [
    { id: id("doc-brief"), title: "Initial scene briefing", kind: "report", body: "Incident: 12 November 2026. Discovery: 21:10. Rainwood House, Haputale. Preserve the study, outgoing post, original camera media, and laundry. Record witness claims separately from verified facts." },
    { id: id("doc-audit"), title: "Bank confirmation and pension audit", kind: "record", evidenceId: id("ledger"), body: "Three pension transfers were paid to Hill Supply. Corporate and bank records identify Rohan Senanayake as sole director and authorised signatory. No staff loan mandate exists." },
    { id: id("doc-exam"), title: "Medical and scene findings", kind: "report", evidenceId: id("report"), body: "Fatal blunt impact. Estimated death window 20:50–21:00. Tea screen negative. Elimination prints were collected from all four suspects." },
  ],
  clueConnections: [
    ["scheduled-email", "audit-meeting", "supports", "The alibi was written before the meeting it covers"],
    ["ring", "missing-weight", "leads_to", "What stood on the blotter is what is missing"],
    ["green-bundle", "linen-trace", "supports", "The sighting and the fibres agree, without naming anyone"],
    ["pension-trail", "page-match", "explains", "The page is why he died"],
    ["letters-on-desk", "letters", "contradicts", "The letters were still there after Anika says she took them"],
  ].map(([from, to, relation, label], i) => ({ id: id(`connection-${i}`), from: id(from!), to: id(to!), relation: relation as "supports" | "leads_to" | "explains" | "contradicts", label: label! })),
  triggers: [
    { id: id("trigger-accounts"), name: "Follow the audit", description: "The diary or Anika's admission opens the accounts wing.", enabled: true, condition: accountsOpen, actions: [{ id: id("action-accounts"), kind: "unlock_location", targetId: id("accounts"), label: "Accounts wing" }, notice("accounts", "New area: Accounts wing.")] },
    { id: id("trigger-laundry"), name: "Trace the exit", description: "The UV trail, Malini's sighting or the recording leads to the laundry.", enabled: true, condition: laundryOpen, actions: [notice("laundry", "New room in the service wing: Laundry corridor.")] },
    { id: id("trigger-burn"), name: "Page 47 burns", description: "Rohan, let out of sight before the laundry is searched, destroys the page.", enabled: true, condition: all(released, not(when("evidence_discovered", "page"))), actions: [{ id: id("action-burn"), kind: "unlock_clue", targetId: id("burnt"), label: "Smoke from the stove" }, notice("burn", "The constable lost Rohan for three minutes. There is smoke coming from the kitchen stove.")] },
    { id: id("trigger-basket"), name: "Rohan goes to the basket", description: "Rohan, let out after the page is secured, gives himself away.", enabled: true, condition: all(released, when("evidence_discovered", "page")), actions: [{ id: id("action-basket"), kind: "unlock_clue", targetId: id("basket-return"), label: "Straight to the basket" }, notice("basket", "The constable reports: Rohan went straight to the laundry and lifted the lining of one basket.")] },
    { id: id("trigger-confront"), name: "A case to answer", description: "A broken alibi, the weapon and the money trail open the final interrogation.", enabled: true, condition: clueIf("false-alibi", "weight-match", "pension-trail"), actions: [{ id: id("action-confront"), kind: "unlock_interview", targetId: id("int-confrontation"), label: "Rohan's final interview" }, notice("confront", "Rohan will see you again. This time, bring everything.")] },
  ],
  flowNodes: [
    ["start", "start", "The storm closes in", undefined, 0, 0],
    ["brief", "briefing", "Read the scene briefing", undefined, 0, 130],
    ["study", "scene", "Search the study", "scene-study", 0, 300],
    ["people", "interview", "Question the daughter", "int-anika", -360, 300],
    ["chef", "interview", "Question the chef", "int-malini", 360, 300],
    ["manager", "interview", "Test the timestamp", "int-rohan", -540, 500],
    ["press", "interview", "Check the journalist", "int-dev", 540, 500],
    ["accounts", "location", "Follow the money", "accounts", -180, 580],
    ["laundry", "scene", "Search the laundry", "scene-laundry", 180, 580],
    ["confront", "interview", "Confront Rohan with proof", "int-confrontation", 0, 850],
    ["accuse", "accusation", "Accuse and answer objections", undefined, 0, 1030],
    ["reveal", "reveal", "The reconstruction", undefined, 0, 1200],
  ].map(([key, kind, label, ref, x, y]) => ({ id: id(`flow-${key}`), kind: kind as CaseBundle["flowNodes"][number]["kind"], label: label as string, refId: ref ? id(ref as string) : undefined, required: ["start", "brief", "accuse", "reveal"].includes(key as string), position: { x: x as number, y: y as number } })),
  flowEdges: [
    ["start", "brief"], ["brief", "study"], ["brief", "people"], ["brief", "chef"], ["brief", "manager"], ["brief", "press"],
    ["study", "accounts"], ["people", "accounts"], ["study", "laundry"], ["chef", "laundry"], ["press", "laundry"],
    ["accounts", "confront"], ["laundry", "confront"], ["manager", "confront"],
    ["confront", "accuse"], ["accuse", "reveal"],
  ].map(([source, target], i) => ({ id: id(`flow-edge-${i}`), source: id(`flow-${source}`), target: id(`flow-${target}`) })),
  theories: [
    { id: id("theory-rohan"), name: "The concealed audit", killerId: id("rohan"), motive, method, supportingEvidenceIds: requiredEvidenceIds, contradictingEvidenceIds: [], requiredClueIds: ["pension-trail", "scheduled-email", "weight-match", "latch-truth"].map(id), isCorrect: true },
    { id: id("theory-anika"), name: "The threatened inheritance", killerId: id("anika"), motive: "Prevent the sale of her mother's hotel", method: "Strike during the family argument and lock the deadbolt", supportingEvidenceIds: [id("diary")], contradictingEvidenceIds: ["call", "cancellation", "latch", "report"].map(id), requiredClueIds: [], isCorrect: false },
    { id: id("theory-malini"), name: "Revenge in the tea", killerId: id("malini"), motive: "Revenge for the missing staff pensions", method: "Poison the tea delivered before the blackout", supportingEvidenceIds: [id("tea"), id("ledger")], contradictingEvidenceIds: [id("report"), id("generator")], requiredClueIds: [], isCorrect: false },
    { id: id("theory-dev"), name: "A story worth killing for", killerId: id("dev"), motive: "Turn an unproven scandal into a career-making story", method: "Strike the source after a failed blackmail demand", supportingEvidenceIds: [id("diary")], contradictingEvidenceIds: [id("camera"), id("page")], requiredClueIds: [], isCorrect: false },
  ],
  hints: [
    { id: id("hint-1"), order: 1, text: "Rooms are not labelled. Sweep slowly: a glint means something is there. Take the UV lamp into the study and onto the landing and sweep the beam slowly: stains glow only inside it. Things inside the desk, the post tray and the basket only show once you open them.", image: study, cost: 0, scorePenalty: 20 },
    { id: id("hint-2"), order: 2, text: "Pressing a statement costs nothing and often gives you the fact that breaks somebody else's story. Malini saw what was on the desk at 20:45. Compare that with what Anika says she took at 20:42.", image: cover, cost: 0, scorePenalty: 35 },
    { id: id("hint-3"), order: 3, text: "The cabinet in the records room opens with a birthday. Arun's diary says whose; a plaque in reception gives the date. A sent email proves a server was awake, not a man: read the mail audit.", image: IMG.evPhoneZoom, cost: 0, scorePenalty: 50 },
    { id: id("hint-4"), order: 4, text: "On the board, link the scheduled email to the diary appointment. Search the laundry before you let Rohan out of your sight. In the laundry, compare the folded page with the ledger, then brush powder back and forth over the page and the weight.", image: cover, cost: 0, scorePenalty: 75 },
  ],
  solution: {
    killerId: id("rohan"), motive, method, weapon: "brass tea weight", requiredEvidenceIds,
    supportingEvidenceIds: ["report", "page", "linen", "call", "generator", "camera", "cancellation"].map(id),
    correctTimelineIds: ["schedule", "tea-time", "call-time", "camera-time", "blackout", "meeting", "death", "power", "discovery"].map(id),
    acceptableAlternatives: ["Conceal the theft of staff pension funds", "Stop Arun exposing pension embezzlement"],
    partialCredit: [{ label: "Recognise that the locked door was a spring latch", points: 50 }, { label: "Reject the scheduled email as an alibi", points: 50 }],
    scoring: { maxScore: 1000, correctKiller: 350, correctMotive: 200, correctMethod: 150, timelineAccuracy: 150, perRequiredEvidence: 20, timeBonusUnderMinutes: 60, timeBonus: 50, wrongAccusationPenalty: 200 },
    explanation: "Rohan stole staff pension contributions through Hill Supply. Arun found the transfers, cancelled the sale, and summoned Rohan with the original ledger before meeting Dev. Rohan scheduled a supplier email at 20:31, then climbed the service stairs during the outage. At 20:54 he struck Arun with the brass tea weight, tore out page 47, and left through the spring-latching door. He hid the weight, linen and page in the laundry. At 21:05 Anika let herself in with the spare key, found her father, took her mother's letters and said nothing. Her call, Malini's bodycam footage and Dev's time-lapse clear all three for the fatal minutes. Malini's green sleeve points the way but names nobody; the grip in the brass and the thumb on the page do.",
  },
  reveal: [
    ["19:40", "The debt beneath the books", "Having cancelled the sale that afternoon, Arun checks the pension transfers and finds they end at Rohan's company. He arranges to give Dev the records after confronting his manager.", IMG.evRecords, "ledger"],
    ["20:31", "An alibi sent in advance", "Rohan queues the supplier email for 20:55. Later, its timestamp will appear to place him at his desk. The server keeps the earlier scheduling event.", rohan, "dispatch"],
    ["20:50", "Four people in the dark", "The storm cuts the power. Anika stays on her recorded call, Malini holds a lantern for the electrician, and Dev stands in his own camera's reflection. Rohan carries the ledger up the service stairs.", cover, "generator"],
    ["20:54", "The page worth more than a life", "Arun refuses another delay. Rohan strikes him with the brass tea weight and tears out the page that names him. His bloodied thumb leaves the print that will undo him.", study, "weight"],
    ["20:57", "The door closes", "Rohan wraps the weight in a tablecloth and pulls the door shut. The spring latch catches. The deadbolt is never turned: the key inside never made the room impossible to leave.", IMG.evPrint, "latch"],
    ["21:03", "A bundle, not a face", "As the lights return, Rohan pushes the bundle into a laundry basket and the page under its lining. Malini glimpses a green sleeve, and for a while tells nobody.", malini, "linen"],
    ["21:05", "A daughter at the door", "Anika lets herself in to apologise and finds her father on the floor. She takes her mother's letters, lets the latch catch behind her, and five minutes later 'discovers' him with Malini.", anika, "call"],
  ].map(([time, title, text, image, item], index) => ({ id: id(`reveal-${index}`), order: index + 1, time: time!, title: title!, text: text!, image: image!, evidenceId: id(item!), durationSec: 18, transition: "dissolve" })),
};
