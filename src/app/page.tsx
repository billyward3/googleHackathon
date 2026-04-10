"use client";

import { useEffect, useRef, useState } from "react";
import { FamilyPanel } from "@/components/family-panel";
import { HousePanel } from "@/components/house-panel";
import { MapCanvas } from "@/components/map-canvas";
import { TopBar } from "@/components/top-bar";
import { createSeedState } from "@/data/seedScenario";
import { applyFifoStep, getNextFifoStep } from "@/lib/fifoEngine";
import { normalizePriorityRules } from "@/lib/house-priority";
import { getHouseholdById, getUnitById } from "@/lib/eligibility";
import { MOVE_OUT_POINT, QUEUE_DOCK_POINT } from "@/lib/map-layout";
import { buildSimulationMetrics } from "@/lib/metrics";
import { buildTtcRound, applyTtcCycle, finalizeResults } from "@/lib/ttcEngine";
import { deepClone } from "@/lib/utils";
import { HousePriorityCriterion } from "@/types/housing";
import {
  FloatingMove,
  Household,
  MoveLogEntry,
  SimulationPhase,
  SimulationState,
} from "@/types/housing";

function createInitialState() {
  return deepClone(createSeedState());
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function appendLog(
  state: SimulationState,
  entry: Omit<MoveLogEntry, "id">,
): SimulationState {
  return {
    ...state,
    moveLog: [
      ...state.moveLog,
      {
        ...entry,
        id: `${entry.phase}-${state.moveLog.length + 1}`,
      },
    ],
  };
}

function swapArrayValue<T>(values: T[], index: number, nextValue: T) {
  const nextIndex = values.findIndex((value) => value === nextValue);
  if (nextIndex === -1 || nextIndex === index) {
    return values;
  }

  const copy = [...values];
  [copy[index], copy[nextIndex]] = [copy[nextIndex], copy[index]];
  return copy;
}

export default function HomePage() {
  const [state, setState] = useState<SimulationState>(createInitialState);
  const [phase, setPhase] = useState<SimulationPhase>("setup");
  const [speed, setSpeed] = useState(1);
  const [isPaused, setIsPaused] = useState(false);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [selectedHouseholdId, setSelectedHouseholdId] = useState<string | null>("q1");
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [floatingMoves, setFloatingMoves] = useState<FloatingMove[]>([]);
  const [activeQueueAssignmentId, setActiveQueueAssignmentId] = useState<string | null>(null);
  const [recentlyAssignedHouseholdId, setRecentlyAssignedHouseholdId] = useState<string | null>(null);
  const [fifoBaseline, setFifoBaseline] = useState<SimulationState | null>(null);
  const [ttcRound, setTtcRound] = useState<ReturnType<typeof buildTtcRound> | null>(null);
  const [ttcStage, setTtcStage] = useState<"idle" | "preferences" | "spotlight" | "moving">("idle");
  const [advanceTick, setAdvanceTick] = useState(0);

  const stateRef = useRef(state);
  const pausedRef = useRef(isPaused);
  const speedRef = useRef(speed);
  const runTokenRef = useRef(0);
  const advanceRef = useRef(advanceTick);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    advanceRef.current = advanceTick;
  }, [advanceTick]);

  const metrics = buildSimulationMetrics(fifoBaseline, state, state.results);
  const canRunFifo = phase === "setup";
  const canRunTtc = phase === "post_fifo";
  const canAdvanceTtc =
    phase === "ttc" && (ttcStage === "preferences" || ttcStage === "spotlight");

  function commit(nextState: SimulationState) {
    stateRef.current = nextState;
    setState(nextState);
  }

  async function waitWithPause(durationMs: number, token: number) {
    let elapsed = 0;

    while (elapsed < durationMs) {
      if (token !== runTokenRef.current) {
        return false;
      }

      if (pausedRef.current) {
        await sleep(120);
        continue;
      }

      const slice = Math.min(80, durationMs - elapsed);
      await sleep(slice);
      elapsed += slice;
    }

    return token === runTokenRef.current;
  }

  async function waitForAdvance(token: number) {
    const seenAdvance = advanceRef.current;

    while (advanceRef.current === seenAdvance) {
      if (token !== runTokenRef.current) {
        return false;
      }

      await sleep(100);
    }

    return token === runTokenRef.current;
  }

  function clearOptInOverrides(households: typeof state.households) {
    if (typeof window === "undefined") return;
    for (const h of households) {
      localStorage.removeItem(`ttc:optedIn:${h.id}`);
    }
  }

  function resetScenario() {
    runTokenRef.current += 1;
    clearOptInOverrides(stateRef.current.households);
    const nextState = createInitialState();
    setPhase("setup");
    setSpeed(1);
    setIsPaused(false);
    setComparisonMode(false);
    setSelectedHouseholdId("q1");
    setSelectedUnitId(null);
    setFloatingMoves([]);
    setActiveQueueAssignmentId(null);
    setRecentlyAssignedHouseholdId(null);
    setFifoBaseline(null);
    setTtcRound(null);
    setTtcStage("idle");
    setAdvanceTick(0);
    commit(nextState);
  }

  function clearSelectedUnit() {
    setSelectedUnitId(null);
  }

  function advanceTtc() {
    setAdvanceTick((value) => value + 1);
  }

  function updateHousehold(
    householdId: string,
    patch: Partial<
      Pick<
        Household,
        "householdSize" | "accessibilityNeed" | "waitTimeMonths" | "priorityGroup" | "optedIn"
      >
    >,
  ) {
    const familyEditable = phase === "setup" || phase === "post_fifo";
    const canToggleOptIn = phase === "post_fifo";

    const nextHouseholds = state.households.map((household) => {
      if (household.id !== householdId || household.source !== "fifo_queue") {
        return household;
      }

      return {
        ...household,
        ...("householdSize" in patch && familyEditable ? { householdSize: patch.householdSize! } : {}),
        ...("accessibilityNeed" in patch && familyEditable
          ? { accessibilityNeed: patch.accessibilityNeed! }
          : {}),
        ...("waitTimeMonths" in patch && familyEditable
          ? { waitTimeMonths: patch.waitTimeMonths! }
          : {}),
        ...("priorityGroup" in patch && familyEditable
          ? { priorityGroup: patch.priorityGroup! }
          : {}),
        ...("optedIn" in patch && canToggleOptIn ? { optedIn: patch.optedIn! } : {}),
      };
    });

    commit({
      ...state,
      households: nextHouseholds,
    });
  }

  function toggleHouseholdOptIn(householdId: string) {
    const household = state.households.find((entry) => entry.id === householdId);
    if (!household || household.source !== "fifo_queue") return;
    const nextValue = !household.optedIn;
    if (typeof window !== "undefined") {
      localStorage.setItem(`ttc:optedIn:${householdId}`, String(nextValue));
    }
    updateHousehold(householdId, { optedIn: nextValue });
  }


  function updateUnit(
    unitId: string,
    patch: Partial<{
      bedrooms: number;
      capacity: number;
      neighborhood: string;
      accessible: boolean;
    }>,
  ) {
    if (phase !== "setup") {
      return;
    }

    commit({
      ...state,
      units: state.units.map((unit) =>
        unit.id === unitId
          ? {
              ...unit,
              ...patch,
            }
          : unit,
      ),
    });
  }

  function updateHousePriorityRule(
    unitId: string,
    rankIndex: number,
    criterion: HousePriorityCriterion,
  ) {
    if (!(phase === "setup" || phase === "post_fifo")) {
      return;
    }

    commit({
      ...state,
      houseProfiles: state.houseProfiles.map((profile) =>
        profile.unitId === unitId
          ? {
              ...profile,
              priorityRules: swapArrayValue(
                normalizePriorityRules(profile),
                rankIndex,
                criterion,
              ),
            }
          : profile,
      ),
    });
  }

  async function runFifo() {
    if (phase !== "setup") {
      return;
    }

    const token = runTokenRef.current + 1;
    runTokenRef.current = token;
    setPhase("fifo");
    setTtcRound(null);
    setTtcStage("idle");

    let working = appendLog(deepClone(stateRef.current), {
      phase: "fifo",
      title: "FIFO begins",
      detail:
        "Original residents start moving out one by one. Each vacancy will be filled by the first eligible household still waiting in FIFO order.",
    });
    commit(working);

    while (true) {
      const step = getNextFifoStep(working);
      if (!step) {
        break;
      }

      const unit = getUnitById(working.units, step.unitId);
      const original = getHouseholdById(working.households, step.originalOccupantId);
      const assignee = getHouseholdById(working.households, step.assignedHouseholdId);

      if (!unit || !original || !assignee || step.queueIndex === null) {
        working = appendLog(working, {
          phase: "fifo",
          title: "FIFO stalled",
          detail:
            "A vacancy could not be matched to an eligible waiting household. Reset or loosen the edits to continue the demo cleanly.",
        });
        commit(working);
        setFloatingMoves([]);
        setActiveQueueAssignmentId(null);
        setPhase("setup");
        return;
      }

      setSelectedUnitId(unit.id);
      setSelectedHouseholdId(assignee.id);
      setActiveQueueAssignmentId(assignee.id);
      setFloatingMoves([
        {
          id: `depart-${original.id}-${unit.id}`,
          householdId: original.id,
          label: original.name,
          from: { x: unit.x, y: unit.y },
          to: MOVE_OUT_POINT,
          tone: "depart",
        },
      ]);

      working = appendLog(working, {
        phase: "fifo",
        title: `${original.name} moves out of ${unit.label}`,
        detail: `${original.name} leaves ${unit.label}, opening a vacancy that FIFO will now fill from the queue.`,
      });
      commit(working);

      if (!(await waitWithPause(780 / speedRef.current, token))) {
        return;
      }

      working = {
        ...working,
        households: working.households.map((household) =>
          household.id === original.id ? { ...household, currentUnitId: null } : household,
        ),
        units: working.units.map((entry) =>
          entry.id === unit.id ? { ...entry, currentOccupantId: null } : entry,
        ),
      };
      commit(working);

      if (!(await waitWithPause(260 / speedRef.current, token))) {
        return;
      }

      setFloatingMoves([
        {
          id: `arrive-${assignee.id}-${unit.id}`,
          householdId: assignee.id,
          label: assignee.name,
          from: QUEUE_DOCK_POINT,
          to: { x: unit.x, y: unit.y },
          tone: "arrive",
        },
      ]);

      working = appendLog(working, {
        phase: "fifo",
        title: `${assignee.name} takes ${unit.label}`,
        detail: `${assignee.name} was the first eligible household in FIFO order and moves in from queue position ${step.queueIndex + 1}.`,
      });
      commit(working);

      if (!(await waitWithPause(920 / speedRef.current, token))) {
        return;
      }

      working = applyFifoStep(working, step);
      commit(working);
      setFloatingMoves([]);
      setActiveQueueAssignmentId(null);
      setRecentlyAssignedHouseholdId(assignee.id);

      if (!(await waitWithPause(260 / speedRef.current, token))) {
        return;
      }

      setRecentlyAssignedHouseholdId(null);
    }

    working = appendLog(
      {
        ...working,
        fifoComplete: true,
      },
      {
        phase: "fifo",
        title: "FIFO complete",
        detail:
          "Every occupied home now belongs to a former queue household. This becomes the baseline for TTC-style coordinated exchange.",
      },
    );

    // Apply any opt-in preferences set from person pages before FIFO ran
    if (typeof window !== "undefined") {
      const overrides: Record<string, boolean> = {};
      for (const h of working.households) {
        const stored = localStorage.getItem(`ttc:optedIn:${h.id}`);
        if (stored !== null) overrides[h.id] = stored === "true";
      }
      if (Object.keys(overrides).length > 0) {
        working = {
          ...working,
          households: working.households.map((h) =>
            overrides[h.id] !== undefined ? { ...h, optedIn: overrides[h.id] } : h,
          ),
        };
      }
    }

    commit(working);
    setFifoBaseline(deepClone(working));
    setPhase("post_fifo");
    setFloatingMoves([]);
    setActiveQueueAssignmentId(null);
  }

  async function runTtc() {
    if (phase !== "post_fifo" || !fifoBaseline) {
      return;
    }

    const token = runTokenRef.current + 1;
    runTokenRef.current = token;
    setAdvanceTick(0);
    setPhase("ttc");
    setTtcStage("idle");

    let working = appendLog(deepClone(stateRef.current), {
      phase: "ttc",
      title: "TTC begins",
      detail:
        "Participating households now point to their highest-ranked reachable homes, while homes point back using their own priority orderings.",
    });
    commit(working);

    const settledIds = new Set<string>();
    const cycleDetails: Record<string, string> = {};

    while (true) {
      const round = buildTtcRound(working, settledIds);
      setTtcRound(round);

      if (round.activeHouseholdIds.length === 0 || round.cycles.length === 0) {
        break;
      }

      setTtcStage("preferences");

      if (!(await waitForAdvance(token))) {
        return;
      }

      const cycle = round.cycles[0];
      const householdNames = cycle.householdIds
        .map((householdId) => getHouseholdById(working.households, householdId)?.name)
        .filter((name): name is string => Boolean(name));

      working = appendLog(working, {
        phase: "ttc",
        title: `${cycle.label} found`,
        detail: `${householdNames.join(", ")} form a ${cycle.label}. Their red preference arrows now turn green before everyone moves together.`,
      });
      commit(working);
      setTtcStage("spotlight");

      if (!(await waitForAdvance(token))) {
        return;
      }

      const moves = cycle.householdIds.map((householdId, index) => {
        const household = getHouseholdById(working.households, householdId)!;
        const sourceUnit = getUnitById(working.units, household.currentUnitId)!;
        const targetUnit = getUnitById(working.units, cycle.targetUnitIds[index])!;
        return {
          id: `ttc-${householdId}-${targetUnit.id}`,
          householdId,
          label: household.name,
          from: { x: sourceUnit.x, y: sourceUnit.y },
          to: { x: targetUnit.x, y: targetUnit.y },
          tone: "cycle" as const,
        };
      });

      setFloatingMoves(moves);
      setSelectedHouseholdId(cycle.householdIds[0] ?? null);
      setSelectedUnitId(cycle.targetUnitIds[0] ?? null);
      setTtcStage("moving");

      if (!(await waitWithPause(760 / speedRef.current, token))) {
        return;
      }

      working = applyTtcCycle(working, cycle);
      const liveResults = finalizeResults(fifoBaseline, working, cycleDetails);
      working = {
        ...working,
        results: liveResults,
      };
      commit(working);
      setFloatingMoves([]);

      for (const householdId of cycle.householdIds) {
        settledIds.add(householdId);
        cycleDetails[householdId] = cycle.label;
      }

      const refreshedResults = finalizeResults(fifoBaseline, working, cycleDetails);
      working = {
        ...working,
        results: refreshedResults,
      };
      commit(working);
      setTtcStage("idle");

      if (!(await waitWithPause(180 / speedRef.current, token))) {
        return;
      }
    }

    const results = finalizeResults(fifoBaseline, working, cycleDetails);
    working = {
      ...working,
      results,
      ttcComplete: true,
    };

    const summaryMetrics = buildSimulationMetrics(fifoBaseline, working, results);
    working = appendLog(working, {
      phase: "ttc",
      title: "TTC complete",
      detail: `${summaryMetrics.improvedCount} households improved, ${summaryMetrics.unchangedCount} stayed the same, and ${summaryMetrics.optedOutCount} opted out.`,
    });

    commit(working);
    setTtcRound(null);
    setTtcStage("idle");
    setPhase("complete");
  }

  return (
    <main className="min-h-screen px-4 py-5 md:px-6 lg:px-8">
      <div className="mx-auto flex max-w-[1850px] flex-col gap-5">
        <TopBar
          phase={phase}
          isPaused={isPaused}
          speed={speed}
          comparisonMode={comparisonMode}
          canRunFifo={canRunFifo}
          canRunTtc={canRunTtc}
          canAdvanceTtc={canAdvanceTtc}
          onReset={resetScenario}
          onRunFifo={runFifo}
          onRunTtc={runTtc}
          onAdvanceTtc={advanceTtc}
          onPauseToggle={() => setIsPaused((value) => !value)}
          onSpeedChange={setSpeed}
          onComparisonToggle={() => setComparisonMode((value) => !value)}
        />

        <div className="grid gap-5 xl:grid-cols-[20rem_minmax(0,1fr)_20rem]">
          <FamilyPanel
            households={state.households}
            units={state.units}
            fifoQueue={state.fifoQueue}
            selectedHouseholdId={selectedHouseholdId}
            activeQueueAssignmentId={activeQueueAssignmentId}
            recentlyAssignedHouseholdId={recentlyAssignedHouseholdId}
          />

          <MapCanvas
            units={state.units}
            households={state.households}
            phase={phase}
            selectedUnitId={selectedUnitId}
            comparisonMode={comparisonMode}
            fifoBaselineUnits={fifoBaseline?.units ?? null}
            results={state.results}
            ttcRound={ttcRound}
            ttcStage={ttcStage}
            floatingMoves={floatingMoves}
            onClearSelection={clearSelectedUnit}
            onToggleHouseholdOptIn={toggleHouseholdOptIn}
          />

          <HousePanel
            units={state.units}
            households={state.households}
            houseProfiles={state.houseProfiles}
            selectedUnitId={selectedUnitId}
            phase={phase}
            metrics={metrics}
            onUpdateUnit={updateUnit}
            onSwapPriorityRule={updateHousePriorityRule}
          />
        </div>
      </div>
    </main>
  );
}
