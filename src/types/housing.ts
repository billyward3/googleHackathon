export type HouseholdSource = "original" | "fifo_queue";

export type SimulationPhase =
  | "setup"
  | "fifo"
  | "post_fifo"
  | "ttc"
  | "complete";

export type ResultStatus = "improved" | "unchanged" | "opted_out" | "not_moved";

export interface HousingUnit {
  id: string;
  label: string;
  neighborhood: string;
  x: number;
  y: number;
  bedrooms: number;
  capacity: number;
  accessible: boolean;
  currentOccupantId: string | null;
  originalOccupantId: string | null;
}

export interface Household {
  id: string;
  name: string;
  source: HouseholdSource;
  currentUnitId: string | null;
  householdSize: number;
  accessibilityNeed: boolean;
  waitTimeMonths: number;
  priorityGroup: string;
  optedIn: boolean;
  preferences: string[];
}

export type HousePriorityCriterion =
  | "accessible_need"
  | "longest_wait"
  | "priority_group"
  | "largest_household"
  | "smallest_household"
  | "best_fit";

export interface HousePriorityProfile {
  unitId: string;
  priorityRules: HousePriorityCriterion[];
}

export interface MoveLogEntry {
  id: string;
  phase: "setup" | "fifo" | "ttc";
  title: string;
  detail: string;
}

export interface HouseholdResult {
  householdId: string;
  status: ResultStatus;
  beforeUnitId: string | null;
  afterUnitId: string | null;
  beforeRank: number | null;
  afterRank: number | null;
  summary: string;
  cycleLabel?: string;
}

export interface SimulationMetrics {
  improvedCount: number;
  unchangedCount: number;
  optedOutCount: number;
  notMovedCount: number;
  averageRankBefore: number | null;
  averageRankAfter: number | null;
  preferenceMismatchBefore: number;
  preferenceMismatchAfter: number;
  overcrowdingBefore: number;
  overcrowdingAfter: number;
  accessibilityMismatchBefore: number;
  accessibilityMismatchAfter: number;
}

export interface SimulationState {
  households: Household[];
  units: HousingUnit[];
  houseProfiles: HousePriorityProfile[];
  fifoQueue: string[];
  moveLog: MoveLogEntry[];
  fifoComplete: boolean;
  ttcComplete: boolean;
  results: Record<string, HouseholdResult>;
}

export interface FifoStep {
  unitId: string;
  originalOccupantId: string;
  assignedHouseholdId: string | null;
  queueIndex: number | null;
}

export interface TtcRoundEdge {
  fromUnitId: string;
  toUnitId: string;
  householdId: string;
  type: "preference" | "priority" | "cycle";
}

export interface TtcCycle {
  householdIds: string[];
  targetUnitIds: string[];
  label: string;
  improvesCount: number;
}

export interface TtcRound {
  edges: TtcRoundEdge[];
  cycles: TtcCycle[];
  activeHouseholdIds: string[];
}

export interface FloatingMove {
  id: string;
  householdId: string;
  label: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  tone: "depart" | "arrive" | "cycle";
}
