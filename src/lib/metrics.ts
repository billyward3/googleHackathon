import { getPreferenceRank, getUnitById } from "@/lib/eligibility";
import {
  Household,
  HouseholdResult,
  SimulationMetrics,
  SimulationState,
} from "@/types/housing";

function average(values: number[]) {
  if (values.length === 0) {
    return null;
  }

  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function housedQueueHouseholds(households: Household[]) {
  return households.filter(
    (household) => household.source === "fifo_queue" && household.currentUnitId !== null,
  );
}

export function computeAssignmentMetrics(before: SimulationState, after: SimulationState) {
  const beforeHouseholds = housedQueueHouseholds(before.households);
  const afterHouseholds = housedQueueHouseholds(after.households);

  const beforeRanks = beforeHouseholds
    .map((household) => getPreferenceRank(household, household.currentUnitId))
    .filter((rank): rank is number => rank !== null);
  const afterRanks = afterHouseholds
    .map((household) => getPreferenceRank(household, household.currentUnitId))
    .filter((rank): rank is number => rank !== null);

  return {
    averageRankBefore: average(beforeRanks),
    averageRankAfter: average(afterRanks),
    preferenceMismatchBefore: beforeHouseholds.filter((household) => {
      const rank = getPreferenceRank(household, household.currentUnitId);
      return rank === null || rank > 2;
    }).length,
    preferenceMismatchAfter: afterHouseholds.filter((household) => {
      const rank = getPreferenceRank(household, household.currentUnitId);
      return rank === null || rank > 2;
    }).length,
    overcrowdingBefore: beforeHouseholds.filter((household) => {
      const unit = getUnitById(before.units, household.currentUnitId);
      return unit ? household.householdSize > unit.capacity : false;
    }).length,
    overcrowdingAfter: afterHouseholds.filter((household) => {
      const unit = getUnitById(after.units, household.currentUnitId);
      return unit ? household.householdSize > unit.capacity : false;
    }).length,
    accessibilityMismatchBefore: beforeHouseholds.filter((household) => {
      const unit = getUnitById(before.units, household.currentUnitId);
      return household.accessibilityNeed && unit ? !unit.accessible : false;
    }).length,
    accessibilityMismatchAfter: afterHouseholds.filter((household) => {
      const unit = getUnitById(after.units, household.currentUnitId);
      return household.accessibilityNeed && unit ? !unit.accessible : false;
    }).length,
  };
}

export function buildSimulationMetrics(
  before: SimulationState | null,
  after: SimulationState,
  results: Record<string, HouseholdResult>,
): SimulationMetrics {
  const counts = Object.values(results).reduce(
    (acc, result) => {
      if (result.status === "improved") acc.improvedCount += 1;
      if (result.status === "unchanged") acc.unchangedCount += 1;
      if (result.status === "not_moved") acc.unchangedCount += 1;
      if (result.status === "opted_out") acc.optedOutCount += 1;
      return acc;
    },
    { improvedCount: 0, unchangedCount: 0, optedOutCount: 0, notMovedCount: 0 },
  );

  if (!before) {
    return {
      ...counts,
      averageRankBefore: null,
      averageRankAfter: null,
      preferenceMismatchBefore: 0,
      preferenceMismatchAfter: 0,
      overcrowdingBefore: 0,
      overcrowdingAfter: 0,
      accessibilityMismatchBefore: 0,
      accessibilityMismatchAfter: 0,
    };
  }

  return {
    ...counts,
    ...computeAssignmentMetrics(before, after),
  };
}
