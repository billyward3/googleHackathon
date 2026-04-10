"use client";

import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { formatRank } from "@/lib/utils";
import { getPreferenceRank, getUnitById } from "@/lib/eligibility";
import { Household, HousingUnit } from "@/types/housing";

interface FamilyPanelProps {
  households: Household[];
  units: HousingUnit[];
  fifoQueue: string[];
  selectedHouseholdId: string | null;
  activeQueueAssignmentId: string | null;
  recentlyAssignedHouseholdId: string | null;
}

function statusLabel(household: Household, units: HousingUnit[]) {
  if (household.source === "original") {
    return household.currentUnitId ? "Seed resident" : "Moved out";
  }

  if (household.currentUnitId) {
    const unit = getUnitById(units, household.currentUnitId);
    return `Housed in ${unit?.label ?? "unit"}`;
  }

  return "Waiting in FIFO";
}

export function FamilyPanel({
  households,
  units,
  fifoQueue,
  selectedHouseholdId,
  activeQueueAssignmentId,
  recentlyAssignedHouseholdId,
}: FamilyPanelProps) {
  const router = useRouter();
  const queueHouseholds = households.filter((household) => household.source === "fifo_queue");
  const waitingHouseholds = queueHouseholds
    .filter((household) => fifoQueue.includes(household.id))
    .sort((left, right) => fifoQueue.indexOf(left.id) - fifoQueue.indexOf(right.id));
  const assignedHouseholds = queueHouseholds
    .filter((household) => household.currentUnitId !== null)
    .sort((left, right) => left.name.localeCompare(right.name));

  return (
    <>
      <aside className="panel-surface flex h-[calc(100vh-12rem)] min-h-[760px] min-w-0 flex-col gap-4 overflow-hidden rounded-[28px] p-4">
        <div className="rounded-[24px] bg-slate-950 px-4 py-4 text-white">
          <div className="display-font text-2xl">Families</div>
          <div className="mt-2 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.18em] text-slate-300">
            <span>{waitingHouseholds.length} waiting</span>
            <span>{assignedHouseholds.length} housed</span>
          </div>
        </div>

        <div className="min-h-0 rounded-[24px] border border-white/70 bg-white/70 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                FIFO queue
              </div>
              <div className="text-lg font-semibold text-slate-900">
                {waitingHouseholds.length} waiting
              </div>
            </div>
            <div className="text-right text-xs text-slate-500">FIFO</div>
          </div>

          <div className="soft-scrollbar max-h-56 min-h-0 space-y-2 overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {waitingHouseholds.map((household) => {
                const waitingIndex = fifoQueue.indexOf(household.id);
                const isAssignedNow = activeQueueAssignmentId === household.id;

                return (
                  <motion.button
                    layout
                    key={household.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: 36, scale: 0.92 }}
                    onClick={() => router.push(`/person?id=${household.id}`)}
                    className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                      isAssignedNow
                        ? "border-emerald-400 bg-emerald-50 shadow-[0_12px_30px_rgba(16,185,129,0.18)]"
                        : "border-cyan-200 bg-cyan-50/80 hover:bg-cyan-50"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate text-sm font-semibold text-slate-900">
                          {household.name}
                        </div>
                        <div className="text-xs text-slate-500">Queue #{waitingIndex + 1}</div>
                      </div>
                      <div className="shrink-0 rounded-full bg-white/80 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-600">
                        {isAssignedNow ? "Assigning" : "Waiting"}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        <div className="min-h-0 flex-1 rounded-[24px] border border-white/70 bg-white/70 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
                Assigned households
              </div>
              <div className="text-lg font-semibold text-slate-900">
                {assignedHouseholds.length} housed
              </div>
            </div>
            <div className="text-right text-xs text-slate-500">Assigned</div>
          </div>

          <div className="soft-scrollbar max-h-full min-h-0 space-y-2 overflow-y-auto pr-1">
            <AnimatePresence initial={false}>
              {assignedHouseholds.map((household) => {
                const unit = getUnitById(units, household.currentUnitId);
                const currentRank = getPreferenceRank(household, household.currentUnitId);
                const isSelected = selectedHouseholdId === household.id;
                const isRecentlyAssigned = recentlyAssignedHouseholdId === household.id;

                return (
                  <motion.button
                    layout
                    key={household.id}
                    initial={{ opacity: 0, y: 10, scale: 0.96 }}
                    animate={{
                      opacity: 1,
                      y: 0,
                      scale: isRecentlyAssigned ? [1, 1.02, 1] : 1,
                    }}
                    transition={{ duration: 0.45 }}
                    onClick={() => router.push(`/person?id=${household.id}`)}
                    className={`w-full rounded-[24px] border px-4 py-4 text-left transition ${
                      isSelected
                        ? "border-slate-900 bg-slate-950 text-white"
                        : isRecentlyAssigned
                          ? "border-emerald-300 bg-emerald-50/90"
                          : "border-white/70 bg-white/65 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="truncate font-semibold">{household.name}</div>
                        <div
                          className={`truncate text-sm ${
                            isSelected ? "text-slate-300" : "text-slate-500"
                          }`}
                        >
                          {statusLabel(household, units)}
                        </div>
                      </div>
                      <div
                        className={`flex shrink-0 items-center gap-2 rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] ${
                          household.optedIn
                            ? isSelected
                              ? "bg-white/10 text-white"
                              : "bg-emerald-50 text-emerald-700"
                            : isSelected
                              ? "bg-white/10 text-white"
                              : "bg-stone-100 text-stone-500"
                        }`}
                      >
                        <span>{household.optedIn ? "✓" : "○"}</span>
                        <span>{household.optedIn ? "TTC in" : "TTC out"}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-full bg-white/70 px-2 py-1 text-slate-600">
                        {unit?.label ?? "Unassigned"}
                      </span>
                      <span className="rounded-full bg-white/70 px-2 py-1 text-slate-600">
                        {formatRank(currentRank)}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </aside>
    </>
  );
}
