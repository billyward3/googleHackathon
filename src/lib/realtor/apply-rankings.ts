import { SimulationState } from "@/types/housing";
import { loadProfile, loadRankings } from "./rankings-store";

/**
 * Maps saved site_id rankings to simulation unit IDs and injects them
 * as q1 (Maya Chen)'s preferences. Also populates q1's household
 * fields from the saved tenant profile.
 */
export function applyRankingsToState(state: SimulationState): SimulationState {
  const siteIds = loadRankings();
  const profile = loadProfile();

  if (!siteIds && !profile) return state;

  const siteIdToUnitId = new Map<string, string>();
  for (const unit of state.units) {
    siteIdToUnitId.set(unit.siteId, unit.id);
  }

  let mappedPreferences: string[] | null = null;
  if (siteIds && siteIds.length > 0) {
    const ranked = siteIds
      .map((siteId) => siteIdToUnitId.get(siteId))
      .filter((unitId): unitId is string => unitId !== undefined);

    if (ranked.length > 0) {
      const rankedSet = new Set(ranked);
      const remaining = state.units
        .map((u) => u.id)
        .filter((id) => !rankedSet.has(id));
      mappedPreferences = [...ranked, ...remaining];
    }
  }

  return {
    ...state,
    households: state.households.map((household) => {
      if (household.id !== "q1") return household;

      return {
        ...household,
        ...(mappedPreferences ? { preferences: mappedPreferences } : {}),
        ...(profile
          ? {
              householdSize: profile.householdSize,
              accessibilityNeed:
                profile.accessibility.wheelchairAccess ||
                profile.accessibility.elderlyFriendly ||
                profile.accessibility.noStairs,
              priorityGroup: buildPriorityGroup(profile),
            }
          : {}),
      };
    }),
  };
}

function buildPriorityGroup(profile: import("./types").TenantProfile): string {
  const needs: string[] = [];

  if (profile.accessibility.wheelchairAccess) needs.push("Wheelchair");
  if (profile.accessibility.elderlyFriendly) needs.push("Senior");
  if (profile.accessibility.noStairs) needs.push("No stairs");
  if (profile.hasPets) needs.push("Pet owner");

  if (needs.length > 0) return needs.join(", ");

  if (profile.householdSize >= 4) return "Large household";

  return "General applicant";
}
