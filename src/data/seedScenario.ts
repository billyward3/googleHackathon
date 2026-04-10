import {
  HousePriorityCriterion,
  HousePriorityProfile,
  Household,
  HousingUnit,
  MoveLogEntry,
  SimulationState,
} from "@/types/housing";

const GROUP_SIZE = 5;
const GROUP_COUNT = 10;

const neighborhoods = [
  "Harbor",
  "Market",
  "Heights",
  "Cedar",
  "River",
  "Garden",
  "Harbor",
  "Market",
  "Heights",
  "Garden",
];

const groupAnchors = [
  { x: 140, y: 130 },
  { x: 650, y: 128 },
  { x: 1160, y: 130 },
  { x: 146, y: 588 },
  { x: 656, y: 592 },
  { x: 1166, y: 592 },
  { x: 284, y: 252 },
  { x: 798, y: 250 },
  { x: 1296, y: 252 },
  { x: 1288, y: 714 },
];

const unitOffsets = [
  { x: 0, y: 0 },
  { x: 118, y: 10 },
  { x: 238, y: 0 },
  { x: 54, y: 124 },
  { x: 194, y: 134 },
];

const queueFirstNames = [
  "Maya",
  "Jordan",
  "Sofia",
  "Amira",
  "Leo",
  "Nia",
  "Omar",
  "Elena",
  "Rosa",
  "Marcus",
  "Ivy",
  "Noah",
  "Ava",
  "Theo",
  "Layla",
  "Evan",
  "Mina",
  "Julian",
  "Talia",
  "Andre",
  "Zara",
  "Malik",
  "Clara",
  "Isaac",
  "Nora",
  "Cam",
  "Priya",
  "Dante",
  "Lina",
  "Miles",
  "Aya",
  "Rowan",
  "Keisha",
  "Daniel",
  "Farah",
  "Eli",
  "Nadine",
  "Victor",
  "Selah",
  "Bennett",
  "Ari",
  "Hana",
  "Mateo",
  "Skye",
  "Zion",
  "Maren",
  "Jonah",
  "Kira",
  "Remy",
  "June",
];

const queueLastNames = [
  "Chen",
  "Ali",
  "King",
  "Green",
  "Santos",
  "Brooks",
  "Price",
  "Moore",
  "Bell",
  "Dale",
  "Scott",
  "Foster",
  "Lewis",
  "Ward",
  "James",
  "Stone",
  "Pierce",
  "Diaz",
  "Cole",
  "Grant",
  "Ross",
  "Shaw",
  "Perry",
  "Bennett",
  "West",
  "Morris",
  "Bautista",
  "Lane",
  "Hale",
  "Nash",
  "Park",
  "Holmes",
  "Fisher",
  "Reed",
  "Khan",
  "Long",
  "Cruz",
  "Dean",
  "Hayes",
  "Wells",
  "Kim",
  "Vega",
  "Lopez",
  "Ray",
  "Cook",
  "Bailey",
  "Sims",
  "Hunt",
  "Owens",
  "Fox",
];

const originalNames = [
  "Reyes",
  "Patel",
  "Lopez",
  "Hughes",
  "Baker",
  "Adams",
  "Nguyen",
  "Carter",
  "Wright",
  "Brown",
  "Young",
  "Turner",
  "Parker",
  "Watson",
  "Flores",
  "Mitchell",
  "Kelly",
  "Sanders",
  "Powell",
  "Long",
  "Perry",
  "Coleman",
  "Russell",
  "Jenkins",
  "Bryant",
  "Barnes",
  "Cole",
  "Gray",
  "Rivera",
  "Cooper",
  "Morgan",
  "Bailey",
  "Richardson",
  "Cox",
  "Ward",
  "Torres",
  "Peterson",
  "Ramirez",
  "James",
  "Watkins",
  "Brooks",
  "Wood",
  "Bennett",
  "Price",
  "Sandoval",
  "Bell",
  "Baez",
  "Cook",
  "Gomez",
  "Howard",
];

const queuePriorityGroups = [
  "Family reunification",
  "Overcrowded",
  "Transfer",
  "Accessible need",
  "Large household",
  "Senior caregiver",
  "Youth transition",
  "Medical proximity",
  "Employment corridor",
  "School stability",
];

const stableGroups = new Set([6, 7]);
const partiallyLockedGroups = new Set([8, 9]);

const allUnitIds = Array.from({ length: GROUP_COUNT * GROUP_SIZE }, (_, index) => `u${index + 1}`);
const units: HousingUnit[] = Array.from({ length: GROUP_COUNT }, (_, groupIndex) => {
  const anchor = groupAnchors[groupIndex];
  const neighborhood = neighborhoods[groupIndex];
  const groupAccessible = groupIndex % 2 === 0;
  const bedroomPattern = [2, 3, 3, 4, 4];
  const capacityPattern = [3, 4, 4, 5, 5];

  return unitOffsets.map((offset, localIndex) => {
    const absoluteIndex = groupIndex * GROUP_SIZE + localIndex + 1;
    return {
      id: `u${absoluteIndex}`,
      label: `${neighborhood}-${String(absoluteIndex).padStart(2, "0")}`,
      neighborhood,
      x: anchor.x + offset.x,
      y: anchor.y + offset.y,
      bedrooms: bedroomPattern[localIndex],
      capacity: capacityPattern[localIndex],
      accessible: groupAccessible && localIndex < 2,
      currentOccupantId: `o${absoluteIndex}`,
      originalOccupantId: `o${absoluteIndex}`,
    };
  });
}).flat();

const originalHouseholds: Household[] = units.map((unit, index) => ({
  id: `o${index + 1}`,
  name: originalNames[index],
  source: "original",
  currentUnitId: unit.id,
  householdSize: Math.min(unit.capacity, unit.bedrooms),
  accessibilityNeed: unit.accessible && index % 6 === 0,
  waitTimeMonths: 0,
  priorityGroup: "Existing resident",
  optedIn: false,
  preferences: [unit.id],
}));

function prioritizeTargets(
  currentUnitId: string,
  preferences: string[],
  preferredUnitIds: string[],
) {
  const front = preferredUnitIds.filter((unitId) => unitId !== currentUnitId);
  const rest = preferences.filter(
    (unitId) => unitId !== currentUnitId && !front.includes(unitId),
  );

  return [...front, currentUnitId, ...rest];
}

const queueHouseholds: Household[] = Array.from({ length: GROUP_COUNT }, (_, groupIndex) => {
  const groupUnitIds = allUnitIds.slice(groupIndex * GROUP_SIZE, groupIndex * GROUP_SIZE + GROUP_SIZE);
  const localWaitBoost = groupIndex < 6 ? 24 : groupIndex < 8 ? 16 : 20;
  const isStableGroup = stableGroups.has(groupIndex);
  const isPartiallyLockedGroup = partiallyLockedGroups.has(groupIndex);
  const neighborhoodPeers = allUnitIds.filter(
    (unitId, index) => neighborhoods[Math.floor(index / GROUP_SIZE)] === neighborhoods[groupIndex],
  );

  return Array.from({ length: GROUP_SIZE }, (_, localIndex) => {
    const absoluteIndex = groupIndex * GROUP_SIZE + localIndex + 1;
    const unitId = groupUnitIds[localIndex];
    const betterTargetId = groupUnitIds[(localIndex + 1) % GROUP_SIZE];
    const secondBetterTargetId = groupUnitIds[(localIndex + 2) % GROUP_SIZE];
    const accessibleNeed = groupIndex % 2 === 0 && localIndex === 0;
    const householdSize = isStableGroup
      ? [1, 2, 3, 4, 5][localIndex]
      : [2, 2, 3, 3, 2][localIndex];
    const optedIn = !(isPartiallyLockedGroup && localIndex === 2);

    const orderedCore = isStableGroup
      ? [unitId, betterTargetId, secondBetterTargetId]
      : [betterTargetId, unitId, secondBetterTargetId];
    const tail = allUnitIds.filter(
      (candidate) => !orderedCore.includes(candidate),
    );
    const neighborhoodTail = [
      ...neighborhoodPeers.filter((candidate) => !orderedCore.includes(candidate)),
      ...tail.filter((candidate) => !neighborhoodPeers.includes(candidate)),
    ];

    return {
      id: `q${absoluteIndex}`,
      name: `${queueFirstNames[absoluteIndex - 1]} ${queueLastNames[absoluteIndex - 1]}`,
      source: "fifo_queue" as const,
      currentUnitId: null,
      householdSize,
      accessibilityNeed: accessibleNeed,
      waitTimeMonths: localWaitBoost + (GROUP_SIZE - localIndex) * 2,
      priorityGroup: queuePriorityGroups[(groupIndex + localIndex) % queuePriorityGroups.length],
      optedIn,
      preferences: [...orderedCore, ...neighborhoodTail],
    };
  });
}).flat();

const crossNeighborhoodPreferenceOverrides: Record<string, string[]> = {
  q1: ["u11"],
  q11: ["u21"],
  q21: ["u1"],
  q3: ["u8"],
  q8: ["u13"],
  q13: ["u18"],
  q18: ["u23"],
  q23: ["u3"],
  q4: ["u29"],
  q29: ["u44"],
  q44: ["u4"],
};

const seededQueueHouseholds: Household[] = queueHouseholds.map((household) => {
  const preferredTargets = crossNeighborhoodPreferenceOverrides[household.id];
  if (!preferredTargets) {
    return household;
  }

  return {
    ...household,
    preferences: prioritizeTargets(
      household.id.replace("q", "u"),
      household.preferences,
      preferredTargets,
    ),
  };
});

const priorityRulePatterns: HousePriorityCriterion[][] = [
  ["accessible_need", "longest_wait", "best_fit", "priority_group"],
  ["best_fit", "largest_household", "longest_wait", "priority_group"],
  ["priority_group", "longest_wait", "best_fit", "largest_household"],
  ["smallest_household", "best_fit", "longest_wait", "priority_group"],
  ["largest_household", "priority_group", "longest_wait", "best_fit"],
];

const houseProfiles: HousePriorityProfile[] = units.map((unit, absoluteUnitIndex) => {
  const localIndex = absoluteUnitIndex % GROUP_SIZE;
  const neighborhoodIndex = neighborhoods.indexOf(unit.neighborhood);
  const basePattern = priorityRulePatterns[(neighborhoodIndex + localIndex) % priorityRulePatterns.length];

  let priorityRules = [...basePattern];

  if (unit.accessible) {
    priorityRules = [
      "accessible_need",
      ...priorityRules.filter((criterion) => criterion !== "accessible_need"),
    ];
  }

  if (unit.capacity >= 5) {
    priorityRules = [
      "largest_household",
      ...priorityRules.filter((criterion) => criterion !== "largest_household"),
    ];
  }

  if (unit.capacity <= 3) {
    priorityRules = [
      "best_fit",
      ...priorityRules.filter((criterion) => criterion !== "best_fit"),
    ];
  }

  return {
    unitId: unit.id,
    priorityRules,
  };
});

const moveLog: MoveLogEntry[] = [
  {
    id: "intro",
    phase: "setup",
    title: "Scenario seeded",
    detail:
      "All 50 units begin occupied by original households. Fifty queue households wait in FIFO order, and the city is intentionally grouped so TTC can expose several clear multi-household exchange cycles after FIFO finishes.",
  },
];

export function createSeedState(): SimulationState {
  return {
    households: [...originalHouseholds, ...seededQueueHouseholds],
    units,
    houseProfiles,
    fifoQueue: seededQueueHouseholds.map((household) => household.id),
    moveLog,
    fifoComplete: false,
    ttcComplete: false,
    results: {},
  };
}
