"use client";

import {
  getHousePriorityLabel,
  HOUSE_PRIORITY_OPTIONS,
  normalizePriorityRules,
  rankHouseholdsForUnit,
} from "@/lib/house-priority";
import { getHouseholdById } from "@/lib/eligibility";
import {
  HousePriorityCriterion,
  Household,
  HousingUnit,
  SimulationMetrics,
  SimulationPhase,
  HousePriorityProfile,
} from "@/types/housing";

interface HousePanelProps {
  units: HousingUnit[];
  households: Household[];
  houseProfiles: HousePriorityProfile[];
  selectedUnitId: string | null;
  phase: SimulationPhase;
  metrics: SimulationMetrics;
  onUpdateUnit: (
    unitId: string,
    patch: Partial<Pick<HousingUnit, "bedrooms" | "capacity" | "neighborhood" | "accessible">>,
  ) => void;
  onSwapPriorityRule: (
    unitId: string,
    rankIndex: number,
    criterion: HousePriorityCriterion,
  ) => void;
}

function metricValue(value: number | null, suffix = "") {
  if (value === null) {
    return "—";
  }

  return `${typeof value === "number" ? value.toFixed(1) : value}${suffix}`;
}

export function HousePanel({
  units,
  households,
  houseProfiles,
  selectedUnitId,
  phase,
  metrics,
  onUpdateUnit,
  onSwapPriorityRule,
}: HousePanelProps) {
  const selectedUnit = selectedUnitId
    ? units.find((unit) => unit.id === selectedUnitId) ?? null
    : null;
  const selectedProfile =
    selectedUnit
      ? houseProfiles.find((profile) => profile.unitId === selectedUnit.id) ?? null
      : null;
  const canEditHouseProps = phase === "setup";
  const canEditPriorities = phase === "setup" || phase === "post_fifo";
  const queueHouseholds = households.filter((household) => household.source === "fifo_queue");
  const selectedOccupant = getHouseholdById(households, selectedUnit?.currentOccupantId ?? null);
  const rankedQueueHouseholds =
    selectedUnit && selectedProfile
      ? rankHouseholdsForUnit(selectedUnit, selectedProfile, queueHouseholds).slice(0, 5)
      : [];
  const selectedPriorityRules = normalizePriorityRules(selectedProfile);
  const fieldClass =
    "mt-2 w-full rounded-[18px] border border-slate-200/80 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500";

  return (
    <aside className="panel-surface soft-scrollbar flex h-[calc(100vh-12rem)] min-h-[760px] min-w-0 flex-col gap-4 overflow-y-auto rounded-[28px] p-4">
      <div className="rounded-[24px] border border-white/70 bg-white/75 p-4">
        {selectedUnit ? (
          <>
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="text-[11px] font-medium uppercase tracking-[0.24em] text-slate-500">
                  Selected home
                </div>
                <div className="display-font mt-1 text-[2rem] leading-none text-slate-900">
                  {selectedUnit.label}
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.16em] text-slate-500">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1">
                    {selectedUnit.neighborhood}
                  </span>
                </div>
              </div>
              <div className="rounded-full bg-slate-100 px-3 py-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
                {canEditHouseProps ? "Editable" : "Locked"}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="text-sm text-slate-600">
                Bedrooms
                <input
                  type="number"
                  min={1}
                  max={5}
                  disabled={!canEditHouseProps}
                  value={selectedUnit.bedrooms}
                  onChange={(event) =>
                    onUpdateUnit(selectedUnit.id, { bedrooms: Number(event.target.value) })
                  }
                  className={fieldClass}
                />
              </label>

              <label className="text-sm text-slate-600">
                Capacity
                <input
                  type="number"
                  min={1}
                  max={5}
                  disabled={!canEditHouseProps}
                  value={selectedUnit.capacity}
                  onChange={(event) =>
                    onUpdateUnit(selectedUnit.id, { capacity: Number(event.target.value) })
                  }
                  className={fieldClass}
                />
              </label>

              <label className="col-span-2 text-sm text-slate-600">
                Neighborhood
                <input
                  type="text"
                  disabled={!canEditHouseProps}
                  value={selectedUnit.neighborhood}
                  onChange={(event) =>
                    onUpdateUnit(selectedUnit.id, { neighborhood: event.target.value })
                  }
                  className={fieldClass}
                />
              </label>
            </div>

            <div className="mt-4 rounded-[20px] border border-slate-200/80 bg-slate-50 px-4 py-3.5 text-sm text-slate-600">
              <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
                Current occupant
              </div>
              <div className="mt-1 text-base font-semibold text-slate-900">
                {selectedOccupant?.name ?? "Vacant"}
              </div>
            </div>

            <div className="mt-4">
              <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.24em] text-slate-500">
                House priority rules
              </div>
              <div className="space-y-2">
                {selectedPriorityRules.map((criterion, index) => (
                  <label
                    key={`${selectedUnit.id}-${index}`}
                    className="flex items-center gap-3 rounded-[18px] border border-slate-200/80 bg-slate-50 px-3 py-2.5 text-sm text-slate-600"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-xs font-semibold text-slate-500 shadow-sm">
                      {index + 1}
                    </span>
                    <select
                      disabled={!canEditPriorities}
                      value={criterion}
                      onChange={(event) =>
                        onSwapPriorityRule(
                          selectedUnit.id,
                          index,
                          event.target.value as HousePriorityCriterion,
                        )
                      }
                      className="w-full bg-transparent text-slate-800 outline-none disabled:cursor-not-allowed"
                    >
                      {HOUSE_PRIORITY_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>

              <div className="mt-4 rounded-[20px] border border-slate-200/80 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
                  Priority stack
                </div>
                <div className="mt-1 font-medium text-slate-900">
                  {selectedPriorityRules.map(getHousePriorityLabel).join(" → ")}
                </div>
              </div>

              {rankedQueueHouseholds.length > 0 ? (
                <div className="mt-4 rounded-[20px] border border-slate-200/80 bg-white px-4 py-3 text-sm text-slate-600 shadow-[0_8px_20px_rgba(15,23,42,0.04)]">
                  <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
                    Top match
                  </div>
                  <div className="mt-1 font-semibold text-slate-900">
                    {rankedQueueHouseholds[0]?.name}
                  </div>
                </div>
              ) : null}
            </div>
          </>
        ) : (
          <div className="rounded-[22px] bg-slate-100/85 px-4 py-5 text-sm leading-6 text-slate-600">
            Click a home on the map to inspect it.
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-[20px] border border-white/60 bg-white/70 p-3 text-center">
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
            Improved
          </div>
          <div className="mt-1.5 text-[2rem] font-semibold leading-none text-emerald-600">
            {metrics.improvedCount}
          </div>
        </div>
        <div className="rounded-[20px] border border-white/60 bg-white/70 p-3 text-center">
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
            Unchanged
          </div>
          <div className="mt-1.5 text-[2rem] font-semibold leading-none text-slate-700">
            {metrics.unchangedCount}
          </div>
        </div>
        <div className="rounded-[20px] border border-white/60 bg-white/70 p-3 text-center">
          <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">
            Opted Out
          </div>
          <div className="mt-1.5 text-[2rem] font-semibold leading-none text-stone-500">
            {metrics.optedOutCount}
          </div>
        </div>
      </div>

      <div className="rounded-[24px] border border-white/60 bg-white/70 p-4">
        <div className="grid grid-cols-1 gap-3 text-sm text-slate-600">
          <div className="rounded-[20px] bg-white px-3 py-3">
            Avg rank
            <div className="mt-1 text-lg font-semibold text-slate-900">
              {metricValue(metrics.averageRankBefore)} → {metricValue(metrics.averageRankAfter)}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
