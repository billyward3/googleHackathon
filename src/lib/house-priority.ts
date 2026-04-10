import { isEligibleForUnit } from "@/lib/eligibility";
import {
  HousePriorityCriterion,
  HousePriorityProfile,
  Household,
  HousingUnit,
} from "@/types/housing";

export const HOUSE_PRIORITY_OPTIONS: Array<{
  value: HousePriorityCriterion;
  label: string;
  description: string;
}> = [
  {
    value: "accessible_need",
    label: "Accessibility need",
    description: "Prefer households that require accessible housing.",
  },
  {
    value: "longest_wait",
    label: "Longest wait",
    description: "Prefer households that have waited the longest.",
  },
  {
    value: "priority_group",
    label: "Priority group",
    description: "Prefer households in stronger policy priority groups.",
  },
  {
    value: "largest_household",
    label: "Larger household",
    description: "Prefer bigger families for larger homes.",
  },
  {
    value: "smallest_household",
    label: "Smaller household",
    description: "Prefer smaller households for compact homes.",
  },
  {
    value: "best_fit",
    label: "Best size fit",
    description: "Prefer households whose size best matches capacity.",
  },
];

const PRIORITY_GROUP_SCORES: Record<string, number> = {
  "Accessible need": 100,
  "Medical proximity": 92,
  "Senior caregiver": 86,
  "Family reunification": 82,
  "School stability": 76,
  "Large household": 74,
  Overcrowded: 72,
  Transfer: 64,
  "Employment corridor": 58,
  "Youth transition": 52,
};

export function getHousePriorityLabel(criterion: HousePriorityCriterion) {
  return (
    HOUSE_PRIORITY_OPTIONS.find((option) => option.value === criterion)?.label ?? criterion
  );
}

const DEFAULT_PRIORITY_RULES: HousePriorityCriterion[] = [
  "best_fit",
  "longest_wait",
  "priority_group",
  "largest_household",
];

export function normalizePriorityRules(
  profile: Partial<HousePriorityProfile> | null | undefined,
) {
  const rules = profile?.priorityRules;
  if (Array.isArray(rules) && rules.length > 0) {
    return rules.filter((rule): rule is HousePriorityCriterion =>
      HOUSE_PRIORITY_OPTIONS.some((option) => option.value === rule),
    );
  }

  return [...DEFAULT_PRIORITY_RULES];
}

function criterionScore(
  criterion: HousePriorityCriterion,
  unit: HousingUnit,
  household: Household,
) {
  switch (criterion) {
    case "accessible_need":
      return household.accessibilityNeed ? 1 : 0;
    case "longest_wait":
      return household.waitTimeMonths;
    case "priority_group":
      return PRIORITY_GROUP_SCORES[household.priorityGroup] ?? 40;
    case "largest_household":
      return household.householdSize;
    case "smallest_household":
      return -household.householdSize;
    case "best_fit": {
      const leftover = unit.capacity - household.householdSize;
      if (leftover < 0) {
        return -999;
      }
      if (leftover === 0) {
        return 100;
      }
      return 100 - leftover * 10;
    }
    default:
      return 0;
  }
}

export function compareHouseholdsForUnit(
  unit: HousingUnit,
  profile: HousePriorityProfile,
  left: Household,
  right: Household,
) {
  for (const criterion of normalizePriorityRules(profile)) {
    const diff =
      criterionScore(criterion, unit, right) - criterionScore(criterion, unit, left);
    if (diff !== 0) {
      return diff;
    }
  }

  if (right.waitTimeMonths !== left.waitTimeMonths) {
    return right.waitTimeMonths - left.waitTimeMonths;
  }

  return left.id.localeCompare(right.id);
}

export function rankHouseholdsForUnit(
  unit: HousingUnit,
  profile: HousePriorityProfile,
  households: Household[],
) {
  return households
    .filter((household) => household.source === "fifo_queue" && isEligibleForUnit(household, unit))
    .sort((left, right) => compareHouseholdsForUnit(unit, profile, left, right));
}
