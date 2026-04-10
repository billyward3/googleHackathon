import { Household, HousingUnit } from "@/types/housing";

export function isEligibleForUnit(household: Household, unit: HousingUnit) {
  if (household.householdSize > unit.capacity) {
    return false;
  }

  if (household.accessibilityNeed && !unit.accessible) {
    return false;
  }

  return true;
}

export function getPreferenceRank(household: Household, unitId: string | null) {
  if (!unitId) {
    return null;
  }

  const rank = household.preferences.indexOf(unitId);
  return rank === -1 ? null : rank;
}

export function describeEligibility(household: Household, unit: HousingUnit) {
  if (household.householdSize > unit.capacity) {
    return "Capacity mismatch";
  }

  if (household.accessibilityNeed && !unit.accessible) {
    return "Accessibility mismatch";
  }

  return "Eligible";
}

export function getUnitById(units: HousingUnit[], unitId: string | null) {
  return units.find((unit) => unit.id === unitId) ?? null;
}

export function getHouseholdById(households: Household[], householdId: string | null) {
  return households.find((household) => household.id === householdId) ?? null;
}
