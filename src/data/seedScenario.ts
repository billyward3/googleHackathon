import {
  HousePriorityCriterion,
  HousePriorityProfile,
  Household,
  HousingUnit,
  MoveLogEntry,
  SimulationState,
} from "@/types/housing";
import { CSV_HOUSES } from "@/data/housingData";

// ─── Units from CSV ────────────────────────────────────────────────────────────

const units: HousingUnit[] = CSV_HOUSES.map((h, i) => ({
  id: `u${i + 1}`,
  label: h.siteName.length > 22 ? h.siteName.slice(0, 22) + "…" : h.siteName,
  neighborhood: h.neighborhood,
  x: h.x,
  y: h.y,
  bedrooms: h.bedrooms,
  capacity: Math.min(h.bedrooms + 1, 6),
  accessible: h.wheelchairAccess,
  currentOccupantId: `o${i + 1}`,
  originalOccupantId: `o${i + 1}`,
  // Extended CSV fields
  siteId: h.id,
  siteName: h.siteName,
  address: h.address,
  ownerDeveloper: h.ownerDeveloper,
  constructionType: h.constructionType,
  bathrooms: h.bathrooms,
  squareFootage: h.squareFootage,
  distanceToTransit: h.distanceToTransit,
  distanceToDowntown: h.distanceToDowntown,
  safety: h.safety,
  noise: h.noise,
  cleanliness: h.cleanliness,
  vibe: h.vibe,
  monthlyRent: h.monthlyRent,
  utilities: h.utilities,
  maintenanceBurden: h.maintenanceBurden,
  houseCondition: h.houseCondition,
  appliances: h.appliances,
  repairsNeeded: h.repairsNeeded,
  stairs: h.stairs,
  wheelchairAccess: h.wheelchairAccess,
  elderlyFriendlyLayout: h.elderlyFriendlyLayout,
  schoolQuality: h.schoolQuality,
  schoolZone: h.schoolZone,
  busAccess: h.busAccess,
  parking: h.parking,
  laundry: h.laundry,
  ac: h.ac,
  yard: h.yard,
  storage: h.storage,
  internetQuality: h.internetQuality,
  unitType: h.unitType,
  backyard: h.backyard,
  balcony: h.balcony,
  nearbyPark: h.nearbyPark,
  petFriendly: h.petFriendly,
  leaseSecurity: h.leaseSecurity,
  lon: h.lon,
  lat: h.lat,
}));

const allUnitIds = units.map((u) => u.id);

// ─── Original residents (one per unit) ────────────────────────────────────────

const originalLastNames = [
  "Reyes","Patel","Lopez","Hughes","Baker","Adams","Nguyen","Carter","Wright","Brown",
  "Young","Turner","Parker","Watson","Flores","Mitchell","Kelly","Sanders","Powell","Long",
  "Perry","Coleman","Russell","Jenkins","Bryant","Barnes","Cole","Gray","Rivera","Cooper",
  "Morgan","Bailey","Richardson","Cox","Ward","Torres","Peterson","Ramirez","James","Watkins",
  "Brooks","Wood","Bennett","Price","Sandoval","Bell","Baez","Cook","Gomez","Howard",
  "Reed","Khan","Dean","Hayes","Wells","Kim","Vega","Lopez","Ray","Sims","Hunt",
  "Owens","Fox","Stone","Pierce","Diaz","Grant","Ross","Shaw","Morris","Bautista",
  "Lane","Hale","Nash","Park","Holmes","Fisher",
];

const originalHouseholds: Household[] = units.map((unit, i) => ({
  id: `o${i + 1}`,
  name: originalLastNames[i % originalLastNames.length],
  source: "original",
  currentUnitId: unit.id,
  householdSize: Math.min(unit.capacity, unit.bedrooms),
  accessibilityNeed: unit.accessible && i % 6 === 0,
  waitTimeMonths: 0,
  priorityGroup: "Existing resident",
  optedIn: false,
  preferences: [unit.id],
}));

// ─── Queue households ─────────────────────────────────────────────────────────

const queueFirstNames = [
  "Maya","Jordan","Sofia","Amira","Leo","Nia","Omar","Elena","Rosa","Marcus",
  "Ivy","Noah","Ava","Theo","Layla","Evan","Mina","Julian","Talia","Andre",
  "Zara","Malik","Clara","Isaac","Nora","Cam","Priya","Dante","Lina","Miles",
  "Aya","Rowan","Keisha","Daniel","Farah","Eli","Nadine","Victor","Selah","Bennett",
  "Ari","Hana","Mateo","Skye","Zion","Maren","Jonah","Kira","Remy","June",
  "Cora","Felix","Imani","Tobias","Yara","Silas","Dara","Ezra","Linh","Caden",
  "Amara","Declan","Riya","Finn","Lena","Asher","Zola","Hugo","Nadia","Elias",
  "Tara","Cyrus","Malia","Bram","Sera","Anton","Wren","Idris","Pita","Vera",
  "Kai","Freya","Jabari","Lyra","Soren","Adaeze","Remi","Juno","Kofi","Astrid",
  "Nile","Bea","Olu","Clem","Sasha","Drew","Yemi","Lior","Ora","Tariq",
  "Sela","Ines","Ciro","Mira","Thad","Yuki","Amir","Lexi","Zev","Emeka",
  "Nyah","Ren","Chloe","Sai","Bex","Amos","Faye","Osei","Luz","Kwame",
];

const queueLastNames = [
  "Chen","Ali","King","Green","Santos","Brooks","Price","Moore","Bell","Dale",
  "Scott","Foster","Lewis","Ward","James","Stone","Pierce","Diaz","Cole","Grant",
  "Ross","Shaw","Perry","Bennett","West","Morris","Bautista","Lane","Hale","Nash",
  "Park","Holmes","Fisher","Reed","Khan","Long","Cruz","Dean","Hayes","Wells",
  "Kim","Vega","Lopez","Ray","Cook","Bailey","Sims","Hunt","Owens","Fox",
  "Nguyen","Patel","Rivera","Washington","Thompson","Martinez","Robinson","Clark","Rodriguez","Harris",
  "Jackson","White","Taylor","Anderson","Thomas","Wilson","Martin","Garcia","Lee","Perez",
  "Johnson","Jones","Miller","Davis","Brown","Young","Turner","Hall","Adams","Nelson",
  "Carter","Mitchell","Perez","Roberts","Turner","Phillips","Campbell","Parker","Edwards","Collins",
  "Stewart","Sanchez","Morris","Rogers","Reed","Cook","Morgan","Bell","Murphy","Bailey",
  "Cooper","Richardson","Cox","Howard","Ward","Torres","Peterson","Gray","Ramirez","James",
  "Watson","Brooks","Kelly","Sanders","Powell","Wood","Bennett","Price","Gomez","Russell",
];

const priorityGroups = [
  "Family reunification","Overcrowded","Transfer","Accessible need","Large household",
  "Senior caregiver","Youth transition","Medical proximity","Employment corridor","School stability",
];

const QUEUE_COUNT = 114; // ~1.5× the 76 units

// Group units by neighborhood for preference generation
const unitsByNeighborhood: Record<string, string[]> = {};
for (const unit of units) {
  if (!unitsByNeighborhood[unit.neighborhood]) {
    unitsByNeighborhood[unit.neighborhood] = [];
  }
  unitsByNeighborhood[unit.neighborhood].push(unit.id);
}

const neighborhoods = Object.keys(unitsByNeighborhood);

function shuffleSeeded(arr: string[], seed: number): string[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = ((seed * 1103515245 + 12345) & 0x7fffffff) % (i + 1);
    seed = j;
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

const queueHouseholds: Household[] = Array.from({ length: QUEUE_COUNT }, (_, i) => {
  const neighborhoodIndex = i % neighborhoods.length;
  const preferredNeighborhood = neighborhoods[neighborhoodIndex];
  const neighborhoodUnits = unitsByNeighborhood[preferredNeighborhood] ?? [];
  const otherUnits = allUnitIds.filter((id) => !neighborhoodUnits.includes(id));

  // First prefer neighborhood units, then others (with seeded shuffle for variety)
  const shuffledNeighborhood = shuffleSeeded(neighborhoodUnits, i * 17 + 3);
  const shuffledOther = shuffleSeeded(otherUnits, i * 31 + 7);
  const preferences = [...shuffledNeighborhood, ...shuffledOther];

  const accessibilityNeed = i % 8 === 0;
  const householdSize = [1, 2, 2, 3, 3, 4, 2, 3, 1, 4][i % 10];
  const optedIn = true; // everyone opts into TTC by default; can be changed per-person

  return {
    id: `q${i + 1}`,
    name: `${queueFirstNames[i]} ${queueLastNames[i]}`,
    source: "fifo_queue" as const,
    currentUnitId: null,
    householdSize,
    accessibilityNeed,
    waitTimeMonths: 36 - (i % 30),
    priorityGroup: priorityGroups[i % priorityGroups.length],
    optedIn,
    preferences,
  };
});

// Add a handful of cross-neighborhood preference overrides to seed TTC cycles
const overrides: Record<string, string[]> = {
  q1: ["u11", "u3"],
  q11: ["u21", "u1"],
  q21: ["u1", "u11"],
  q3: ["u8", "u13"],
  q8: ["u13", "u3"],
  q13: ["u3", "u8"],
  q5: ["u30", "u47"],
  q30: ["u47", "u5"],
  q47: ["u5", "u30"],
};

const seededQueueHouseholds: Household[] = queueHouseholds.map((hh) => {
  const preferred = overrides[hh.id];
  if (!preferred) return hh;
  const front = preferred.filter((id) => id !== hh.preferences[0]);
  const rest = hh.preferences.filter((id) => !front.includes(id));
  return { ...hh, preferences: [...front, ...rest] };
});

// ─── House priority profiles ───────────────────────────────────────────────────

const priorityRulePatterns: HousePriorityCriterion[][] = [
  ["accessible_need", "longest_wait", "best_fit", "priority_group"],
  ["best_fit", "largest_household", "longest_wait", "priority_group"],
  ["priority_group", "longest_wait", "best_fit", "largest_household"],
  ["smallest_household", "best_fit", "longest_wait", "priority_group"],
  ["largest_household", "priority_group", "longest_wait", "best_fit"],
];

const houseProfiles: HousePriorityProfile[] = units.map((unit, i) => {
  const basePattern = priorityRulePatterns[i % priorityRulePatterns.length];
  let priorityRules = [...basePattern];

  if (unit.accessible) {
    priorityRules = [
      "accessible_need",
      ...priorityRules.filter((c) => c !== "accessible_need"),
    ];
  }

  if (unit.capacity >= 5) {
    priorityRules = [
      "largest_household",
      ...priorityRules.filter((c) => c !== "largest_household"),
    ];
  }

  if (unit.capacity <= 2) {
    priorityRules = [
      "best_fit",
      ...priorityRules.filter((c) => c !== "best_fit"),
    ];
  }

  return { unitId: unit.id, priorityRules };
});

// ─── Move log ─────────────────────────────────────────────────────────────────

const moveLog: MoveLogEntry[] = [
  {
    id: "intro",
    phase: "setup",
    title: "Scenario seeded",
    detail:
      "All 76 Detroit affordable housing sites are loaded from the City's $1B construction dataset. Each unit is occupied by a seed resident; 50 queue households wait in FIFO order.",
  },
];

// ─── Export ───────────────────────────────────────────────────────────────────

export function createSeedState(): SimulationState {
  return {
    households: [...originalHouseholds, ...seededQueueHouseholds],
    units,
    houseProfiles,
    fifoQueue: seededQueueHouseholds.map((hh) => hh.id),
    moveLog,
    fifoComplete: false,
    ttcComplete: false,
    results: {},
  };
}
