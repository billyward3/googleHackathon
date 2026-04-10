import { getHouseholdById, getUnitById, isEligibleForUnit } from "@/lib/eligibility";
import { FifoStep, SimulationState } from "@/types/housing";

export function getRemainingOriginalUnitIds(state: SimulationState) {
  return state.units
    .filter((unit) => {
      if (!unit.currentOccupantId) {
        return false;
      }

      const occupant = getHouseholdById(state.households, unit.currentOccupantId);
      return occupant?.source === "original";
    })
    .map((unit) => unit.id);
}

export function getNextFifoStep(state: SimulationState): FifoStep | null {
  const remainingOriginals = getRemainingOriginalUnitIds(state);
  if (remainingOriginals.length === 0) {
    return null;
  }

  const unitId = remainingOriginals[Math.floor(Math.random() * remainingOriginals.length)];
  const unit = getUnitById(state.units, unitId);

  if (!unit?.currentOccupantId) {
    return null;
  }

  const queueIndex = state.fifoQueue.findIndex((householdId) => {
    const household = getHouseholdById(state.households, householdId);
    return household ? isEligibleForUnit(household, unit) : false;
  });

  return {
    unitId,
    originalOccupantId: unit.currentOccupantId,
    assignedHouseholdId: queueIndex === -1 ? null : state.fifoQueue[queueIndex],
    queueIndex: queueIndex === -1 ? null : queueIndex,
  };
}

export function applyFifoStep(state: SimulationState, step: FifoStep) {
  const units = state.units.map((unit) =>
    unit.id === step.unitId
      ? {
          ...unit,
          currentOccupantId: step.assignedHouseholdId,
        }
      : unit,
  );

  const households = state.households.map((household) => {
    if (household.id === step.originalOccupantId) {
      return {
        ...household,
        currentUnitId: null,
      };
    }

    if (household.id === step.assignedHouseholdId) {
      return {
        ...household,
        currentUnitId: step.unitId,
      };
    }

    return household;
  });

  const nextState: SimulationState = {
    ...state,
    households,
    units,
    fifoQueue:
      step.assignedHouseholdId === null
        ? state.fifoQueue
        : state.fifoQueue.filter((householdId) => householdId !== step.assignedHouseholdId),
  };

  return {
    ...nextState,
    fifoComplete: getRemainingOriginalUnitIds(nextState).length === 0,
  };
}
