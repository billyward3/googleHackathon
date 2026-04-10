import {
  getHouseholdById,
  getPreferenceRank,
  getUnitById,
  isEligibleForUnit,
} from "@/lib/eligibility";
import {
  Household,
  HouseholdResult,
  SimulationState,
  TtcCycle,
  TtcRound,
  TtcRoundEdge,
} from "@/types/housing";

type TradeOption = {
  toHouseholdId: string;
  targetUnitId: string;
};

type TradeEdge = {
  fromHouseholdId: string;
  toHouseholdId: string;
  targetUnitId: string;
};

function activeParticipants(state: SimulationState, settledIds: Set<string>) {
  return state.households.filter(
    (household) =>
      household.source === "fifo_queue" &&
      household.currentUnitId !== null &&
      household.optedIn &&
      !settledIds.has(household.id),
  );
}

function buildTradeOptions(
  state: SimulationState,
  settledIds: Set<string>,
): Record<string, TradeOption[]> {
  const participants = activeParticipants(state, settledIds);
  const participantById = Object.fromEntries(
    participants.map((household) => [household.id, household]),
  ) as Record<string, Household>;

  return Object.fromEntries(
    participants.map((household) => {
      const currentRank = getPreferenceRank(household, household.currentUnitId);

      const options = household.preferences
        .filter((unitId) => unitId !== household.currentUnitId)
        .map((unitId) => {
          const unit = getUnitById(state.units, unitId);
          const occupant = getHouseholdById(state.households, unit?.currentOccupantId ?? null);
          const rank = getPreferenceRank(household, unitId);

          if (
            !unit ||
            !occupant ||
            occupant.source !== "fifo_queue" ||
            !occupant.optedIn ||
            settledIds.has(occupant.id) ||
            occupant.id === household.id ||
            !participantById[occupant.id] ||
            !isEligibleForUnit(household, unit) ||
            rank === null ||
            currentRank === null ||
            rank >= currentRank
          ) {
            return null;
          }

          return {
            toHouseholdId: occupant.id,
            targetUnitId: unitId,
          };
        })
        .filter((option): option is TradeOption => option !== null)
        .slice(0, 4);

      return [household.id, options];
    }),
  ) as Record<string, TradeOption[]>;
}

function normalizeCycle(edges: TradeEdge[]) {
  const householdIds = edges.map((edge) => edge.fromHouseholdId);
  const minId = [...householdIds].sort()[0];
  const startIndex = householdIds.indexOf(minId);
  const rotated = householdIds
    .slice(startIndex)
    .concat(householdIds.slice(0, startIndex));
  return rotated.join("|");
}

function findTradeCycles(
  state: SimulationState,
  tradeOptions: Record<string, TradeOption[]>,
): TtcCycle[] {
  const cycles: TtcCycle[] = [];
  const seen = new Set<string>();
  const participantIds = Object.keys(tradeOptions);

  const dfs = (startId: string, currentId: string, path: string[], edges: TradeEdge[]) => {
    if (path.length > 5) {
      return;
    }

    for (const option of tradeOptions[currentId] ?? []) {
      if (option.toHouseholdId === startId && path.length >= 2) {
        const cycleEdges = [
          ...edges,
          {
            fromHouseholdId: currentId,
            toHouseholdId: option.toHouseholdId,
            targetUnitId: option.targetUnitId,
          },
        ];

        const key = normalizeCycle(cycleEdges);
        if (seen.has(key)) {
          continue;
        }

        seen.add(key);
        const householdIds = cycleEdges.map((edge) => edge.fromHouseholdId);
        const targetUnitIds = cycleEdges.map((edge) => edge.targetUnitId);

        cycles.push({
          householdIds,
          targetUnitIds,
          label: `${householdIds.length}-family cycle`,
          improvesCount: householdIds.length,
        });
        continue;
      }

      if (path.includes(option.toHouseholdId)) {
        continue;
      }

      dfs(
        startId,
        option.toHouseholdId,
        [...path, option.toHouseholdId],
        [
          ...edges,
          {
            fromHouseholdId: currentId,
            toHouseholdId: option.toHouseholdId,
            targetUnitId: option.targetUnitId,
          },
        ],
      );
    }
  };

  for (const householdId of participantIds) {
    dfs(householdId, householdId, [householdId], []);
  }

  return cycles.sort((left, right) => {
    if (right.householdIds.length !== left.householdIds.length) {
      return right.householdIds.length - left.householdIds.length;
    }

    return left.householdIds.join("|").localeCompare(right.householdIds.join("|"));
  });
}

export function buildTtcRound(state: SimulationState, settledIds: Set<string>): TtcRound {
  const participants = activeParticipants(state, settledIds);
  const tradeOptions = buildTradeOptions(state, settledIds);
  const cycles = findTradeCycles(state, tradeOptions);
  const activeCycle = cycles[0];
  const preferenceEdges: TtcRoundEdge[] = participants
    .map((household) => {
      const topChoice = tradeOptions[household.id]?.[0];
      if (!topChoice || !household.currentUnitId) {
        return null;
      }

      return {
        fromUnitId: household.currentUnitId,
        toUnitId: topChoice.targetUnitId,
        householdId: household.id,
        type: "preference" as const,
      };
    })
    .filter((edge): edge is NonNullable<typeof edge> => edge !== null);

  const cycleEdges: TtcRoundEdge[] = activeCycle
    ? activeCycle.householdIds.map((householdId, index) => {
        const household = getHouseholdById(state.households, householdId);
        return {
          fromUnitId: household?.currentUnitId ?? activeCycle.targetUnitIds[index],
          toUnitId: activeCycle.targetUnitIds[index],
          householdId,
          type: "cycle",
        };
      })
    : [];

  return {
    activeHouseholdIds: participants.map((household) => household.id),
    edges: [...preferenceEdges, ...cycleEdges],
    cycles,
  };
}

export function applyTtcCycle(state: SimulationState, cycle: TtcCycle) {
  const assignments = Object.fromEntries(
    cycle.householdIds.map((householdId, index) => [householdId, cycle.targetUnitIds[index]]),
  ) as Record<string, string>;

  const units = state.units.map((unit) => {
    const newOccupantId =
      cycle.householdIds.find((householdId) => assignments[householdId] === unit.id) ?? null;

    if (!newOccupantId) {
      return unit;
    }

    return {
      ...unit,
      currentOccupantId: newOccupantId,
    };
  });

  const households = state.households.map((household) => {
    if (!(household.id in assignments)) {
      return household;
    }

    return {
      ...household,
      currentUnitId: assignments[household.id],
    };
  });

  return {
    ...state,
    households,
    units,
  };
}

export function finalizeResults(
  fifoBaseline: SimulationState,
  finalState: SimulationState,
  cycleDetails: Record<string, string>,
): Record<string, HouseholdResult> {
  const results: Record<string, HouseholdResult> = {};

  for (const household of finalState.households) {
    if (household.source !== "fifo_queue") {
      continue;
    }

    const before = getHouseholdById(fifoBaseline.households, household.id);
    const beforeRank = before ? getPreferenceRank(before, before.currentUnitId) : null;
    const afterRank = getPreferenceRank(household, household.currentUnitId);

    if (!household.optedIn) {
      results[household.id] = {
        householdId: household.id,
        status: "opted_out",
        beforeUnitId: before?.currentUnitId ?? null,
        afterUnitId: household.currentUnitId,
        beforeRank,
        afterRank,
        summary: "Did not participate because TTC participation was turned off.",
      };
      continue;
    }

    const moved = before?.currentUnitId !== household.currentUnitId;
    const improved =
      beforeRank !== null && afterRank !== null ? afterRank < beforeRank : moved;

    if (improved) {
      const beforeLabel = getUnitById(fifoBaseline.units, before?.currentUnitId ?? null)?.label;
      const afterLabel = getUnitById(finalState.units, household.currentUnitId)?.label;
      results[household.id] = {
        householdId: household.id,
        status: "improved",
        beforeUnitId: before?.currentUnitId ?? null,
        afterUnitId: household.currentUnitId,
        beforeRank,
        afterRank,
        cycleLabel: cycleDetails[household.id],
        summary: `Moved from ${beforeLabel} to ${afterLabel} through ${cycleDetails[household.id] ?? "a coordinated exchange"}.`,
      };
      continue;
    }

    results[household.id] = {
      householdId: household.id,
      status: "unchanged",
      beforeUnitId: before?.currentUnitId ?? null,
      afterUnitId: household.currentUnitId,
      beforeRank,
      afterRank,
      summary: "Stayed in the current unit because TTC did not find a better trade cycle for this household.",
    };
  }

  return results;
}
