"use client";

import { motion } from "framer-motion";
import { SimulationPhase } from "@/types/housing";
import { cn } from "@/lib/utils";

interface TopBarProps {
  phase: SimulationPhase;
  isPaused: boolean;
  speed: number;
  comparisonMode: boolean;
  canRunFifo: boolean;
  canRunTtc: boolean;
  canAdvanceTtc: boolean;
  onReset: () => void;
  onRunFifo: () => void;
  onRunTtc: () => void;
  onAdvanceTtc: () => void;
  onPauseToggle: () => void;
  onSpeedChange: (speed: number) => void;
  onComparisonToggle: () => void;
}

const legend = [
  { label: "Improved", classes: "bg-leaf/20 text-emerald-900 ring-1 ring-emerald-500/45" },
  { label: "Unchanged", classes: "bg-slate-100 text-slate-700 ring-1 ring-slate-300" },
  { label: "Opted out", classes: "bg-stone-200 text-stone-600 ring-1 ring-stone-400/50" },
  { label: "Original seed", classes: "bg-coral/15 text-rose-800 ring-1 ring-coral/40" },
  { label: "FIFO queue", classes: "bg-harbor/15 text-cyan-900 ring-1 ring-harbor/45" },
];

export function TopBar({
  phase,
  isPaused,
  speed,
  comparisonMode,
  canRunFifo,
  canRunTtc,
  canAdvanceTtc,
  onReset,
  onRunFifo,
  onRunTtc,
  onAdvanceTtc,
  onPauseToggle,
  onSpeedChange,
  onComparisonToggle,
}: TopBarProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      className="panel-surface flex flex-col gap-3 rounded-[28px] px-5 py-4 md:px-6"
    >
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <div className="display-font text-3xl text-ink">CivicHousing</div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onReset}
            className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Reset scenario
          </button>
          <button
            onClick={onRunFifo}
            disabled={!canRunFifo}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition",
              canRunFifo
                ? "bg-harbor text-cyan-950 hover:bg-harbor/85"
                : "cursor-not-allowed bg-slate-200 text-slate-400",
            )}
          >
            Run FIFO
          </button>
          <button
            onClick={onRunTtc}
            disabled={!canRunTtc}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium transition",
              canRunTtc
                ? "bg-emerald-500 text-white hover:bg-emerald-400"
                : "cursor-not-allowed bg-slate-200 text-slate-400",
            )}
          >
            Run TTC
          </button>
          <button
            onClick={onAdvanceTtc}
            disabled={!canAdvanceTtc}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              canAdvanceTtc
                ? "bg-amber-300 text-slate-950 ring-4 ring-amber-100 hover:bg-amber-200"
                : "cursor-not-allowed bg-slate-200 text-slate-500",
            )}
          >
            Next
          </button>
          <button
            onClick={onPauseToggle}
            className="rounded-full border border-slate-300 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white"
          >
            {isPaused ? "Resume" : "Pause"}
          </button>
          <button
            onClick={onComparisonToggle}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition",
              comparisonMode
                ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                : "border-slate-300 bg-white/70 text-slate-700 hover:bg-white",
            )}
          >
            {comparisonMode ? "Comparison on" : "Comparison off"}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          {legend.map((item) => (
            <span
              key={item.label}
              className={cn(
                "rounded-full px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em]",
                item.classes,
              )}
            >
              {item.label}
            </span>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <div className="rounded-full bg-white/70 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-slate-500">
            Phase: {phase.replace("_", " ")}
          </div>
          <label className="flex items-center gap-3 rounded-full border border-white/60 bg-white/70 px-4 py-2 text-sm text-slate-700">
            <span className="font-medium">Animation speed</span>
            <input
              type="range"
              min={0.5}
              max={20}
              step={0.5}
              value={speed}
              onChange={(event) => onSpeedChange(Number(event.target.value))}
              className="w-28 accent-slate-900"
            />
            <span className="w-10 text-right text-xs uppercase tracking-[0.18em] text-slate-500">
              {speed.toFixed(1)}x
            </span>
          </label>
        </div>
      </div>
    </motion.header>
  );
}
