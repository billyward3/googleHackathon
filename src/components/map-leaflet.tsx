"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { getHouseholdById, getPreferenceRank, getUnitById } from "@/lib/eligibility";
import { QUEUE_DOCK_LATLNG, MOVE_OUT_LATLNG } from "@/lib/map-layout";
import type {
  FloatingMove,
  Household,
  HouseholdResult,
  HousingUnit,
  SimulationPhase,
  TtcCycle,
  TtcRound,
} from "@/types/housing";
import type { LatLngBoundsExpression } from "leaflet";

export interface MapLeafletProps {
  units: HousingUnit[];
  households: Household[];
  phase: SimulationPhase;
  selectedUnitId: string | null;
  comparisonMode: boolean;
  fifoBaselineUnits: HousingUnit[] | null;
  results: Record<string, HouseholdResult>;
  ttcRound: TtcRound | null;
  ttcStage: "idle" | "preferences" | "spotlight" | "moving";
  floatingMoves: FloatingMove[];
  onClearSelection: () => void;
  onToggleHouseholdOptIn: (householdId: string) => void;
}

// ── Helpers copied from map-canvas ────────────────────────────────────────────

function occupantTone(
  occupant: Household | null,
  result: HouseholdResult | undefined,
  phase: SimulationPhase,
) {
  if (!occupant) return "border-slate-200 bg-white/80 text-slate-500";
  if (occupant.source === "original") return "border-coral/50 bg-coral/15 text-rose-900";
  if (phase === "ttc" && occupant.optedIn) return "border-emerald-300 bg-emerald-50 text-emerald-900";
  switch (result?.status) {
    case "improved":  return "border-emerald-400 bg-emerald-50 text-emerald-900 ring-4 ring-emerald-300/35";
    case "opted_out": return "border-stone-300 bg-stone-100 text-stone-500";
    case "not_moved": return "border-amber-300 bg-amber-50 text-amber-800";
    case "unchanged": return "border-slate-300 bg-slate-100 text-slate-700";
    default:          return "border-harbor/45 bg-harbor/15 text-cyan-900";
  }
}

function buildingScale(bedrooms: number) {
  if (bedrooms <= 2) return 0.9;
  if (bedrooms === 3) return 1.02;
  return 1.15;
}

function unitCircleSize(bedrooms: number) {
  if (bedrooms <= 2) return 44;
  if (bedrooms === 3) return 52;
  return 58;
}

function HouseGlyph({
  bedrooms,
  accessible,
  active,
}: {
  bedrooms: number;
  accessible: boolean;
  active: boolean;
}) {
  if (bedrooms >= 4) {
    return (
      <svg width="46" height="46" viewBox="0 0 48 48" className={cn(active && "drop-shadow-[0_0_12px_rgba(16,185,129,0.35)]")}>
        <rect x="10" y="8" width="28" height="30" rx="5" fill="#18263f" />
        <rect x="16" y="3" width="16" height="8" rx="2" fill="#31425d" />
        <rect x="16" y="15" width="5" height="5" rx="1.5" fill="#eef3ff" />
        <rect x="27" y="15" width="5" height="5" rx="1.5" fill="#eef3ff" />
        <rect x="16" y="24" width="5" height="5" rx="1.5" fill="#eef3ff" />
        <rect x="27" y="24" width="5" height="5" rx="1.5" fill="#eef3ff" />
        <rect x="21" y="31" width="6" height="7" rx="1.5" fill="#9acbd0" />
        {accessible ? <circle cx="39" cy="10" r="5" fill="#8ee29f" /> : null}
      </svg>
    );
  }
  if (bedrooms === 3) {
    return (
      <svg width="42" height="42" viewBox="0 0 44 44" className={cn(active && "drop-shadow-[0_0_12px_rgba(16,185,129,0.35)]")}>
        <path d="M6 22 L22 8 L38 22 V36 H6 Z" fill="#223457" />
        <rect x="10" y="21" width="24" height="15" rx="3" fill="#223457" />
        <rect x="14" y="24" width="5" height="5" rx="1.5" fill="#eef3ff" />
        <rect x="25" y="24" width="5" height="5" rx="1.5" fill="#eef3ff" />
        <rect x="19" y="29" width="6" height="7" rx="1.5" fill="#9acbd0" />
        {accessible ? <circle cx="36" cy="10" r="4.5" fill="#8ee29f" /> : null}
      </svg>
    );
  }
  return (
    <svg width="38" height="38" viewBox="0 0 40 40" className={cn(active && "drop-shadow-[0_0_12px_rgba(16,185,129,0.35)]")}>
      <path d="M6 20 L20 9 L34 20 V33 H6 Z" fill="#31517a" />
      <rect x="10" y="22" width="20" height="11" rx="3" fill="#31517a" />
      <rect x="13" y="24" width="4.5" height="4.5" rx="1.5" fill="#eef3ff" />
      <rect x="23" y="24" width="4.5" height="4.5" rx="1.5" fill="#eef3ff" />
      <rect x="17.5" y="27" width="5" height="6" rx="1.5" fill="#9acbd0" />
      {accessible ? <circle cx="33" cy="9" r="4" fill="#8ee29f" /> : null}
    </svg>
  );
}

function buildCycleCurve(
  from: { x: number; y: number },
  to: { x: number; y: number },
  index: number,
) {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy) || 1;
  const offset = 30 + (index % 2) * 18;
  const controlX = midX - (dy / length) * offset;
  const controlY = midY + (dx / length) * offset;
  return {
    path: `M ${from.x} ${from.y} Q ${controlX} ${controlY} ${to.x} ${to.y}`,
    labelX: controlX,
    labelY: controlY,
  };
}

function activeCycleInfo(
  cycle: TtcCycle | null,
  households: Household[],
  units: HousingUnit[],
) {
  if (!cycle) return [];
  const unitTokenMap = new Map<string, string>();
  cycle.householdIds.forEach((householdId, index) => {
    const household = getHouseholdById(households, householdId);
    if (household?.currentUnitId) {
      unitTokenMap.set(household.currentUnitId, String.fromCharCode(65 + index));
    }
  });
  return cycle.householdIds.map((householdId, index) => {
    const household = getHouseholdById(households, householdId);
    const fromUnit = units.find((u) => u.id === household?.currentUnitId);
    const toUnit = units.find((u) => u.id === cycle.targetUnitIds[index]);
    const token = String.fromCharCode(65 + index);
    return {
      householdId,
      token,
      label: household?.name ?? householdId,
      fromLabel: fromUnit?.label ?? "Current unit",
      toLabel: toUnit?.label ?? "Target unit",
      toToken: toUnit ? (unitTokenMap.get(toUnit.id) ?? "?") : "?",
      from: fromUnit,
      to: toUnit,
    };
  });
}

// ── Zoom controls ─────────────────────────────────────────────────────────────

function ZoomControls({ bounds }: { bounds: LatLngBoundsExpression }) {
  const map = useMap();
  const [zoom, setZoom] = useState(map.getZoom());

  useMapEvents({ zoomend: () => setZoom(map.getZoom()) });

  return createPortal(
    <div
      data-map-interactive="true"
      style={{ position: "absolute", left: 16, top: 16, zIndex: 1000 }}
      className="rounded-[22px] border border-white/70 bg-white/90 px-4 py-3 shadow-[0_18px_46px_rgba(15,23,42,0.14)] backdrop-blur"
    >
      <div className="text-[11px] font-medium uppercase tracking-[0.24em] text-slate-500">
        Map controls
      </div>
      <div className="mt-2 flex items-center gap-2">
        <button
          data-map-interactive="true"
          onClick={() => map.zoomOut()}
          className="rounded-full bg-slate-950 px-3 py-2 text-sm font-semibold text-white"
        >
          −
        </button>
        <div className="rounded-full bg-slate-100 px-3 py-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-600">
          z{zoom}
        </div>
        <button
          data-map-interactive="true"
          onClick={() => map.zoomIn()}
          className="rounded-full bg-slate-950 px-3 py-2 text-sm font-semibold text-white"
        >
          +
        </button>
        <button
          data-map-interactive="true"
          onClick={() => map.fitBounds(bounds, { animate: true })}
          className="rounded-full border border-slate-300 px-3 py-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-600"
        >
          Reset
        </button>
      </div>
    </div>,
    map.getContainer(),
  );
}

// ── Map overlay (house markers + TTC arrows + floating moves) ─────────────────

function MapOverlay({
  units,
  households,
  phase,
  selectedUnitId,
  comparisonMode,
  fifoBaselineUnits,
  results,
  ttcRound,
  ttcStage,
  floatingMoves,
  onClearSelection,
  onToggleHouseholdOptIn,
}: MapLeafletProps) {
  const router = useRouter();
  const map = useMap();
  // Re-render whenever the map viewport changes so markers track correctly
  const [, setTick] = useState(0);

  useMapEvents({
    move: () => setTick((t) => t + 1),
    zoom: () => setTick((t) => t + 1),
    click: (e) => {
      const target = e.originalEvent.target as HTMLElement;
      if (!target.closest("[data-map-interactive='true']")) {
        onClearSelection();
      }
    },
  });

  // Project a geographic point to container pixels
  function px(lat: number, lon: number) {
    return map.latLngToContainerPoint([lat, lon]);
  }

  const cycle = useMemo(
    () => ttcRound?.cycles.find((c) => c.improvesCount > 0) ?? ttcRound?.cycles[0] ?? null,
    [ttcRound],
  );
  const cycleMoves = useMemo(
    () => activeCycleInfo(cycle, households, units),
    [cycle, households, units],
  );
  const preferenceEdges = useMemo(
    () => ttcRound?.edges.filter((e) => e.type === "preference") ?? [],
    [ttcRound],
  );
  const activeCycleHouseholdIds = new Set(cycle?.householdIds ?? []);
  const activeCycleUnitIds = new Set(
    cycleMoves.flatMap((m) => [m.from?.id, m.to?.id].filter(Boolean) as string[]),
  );
  const isCycleStage = ttcStage === "spotlight" || ttcStage === "moving";

  const dockPx = px(QUEUE_DOCK_LATLNG.lat, QUEUE_DOCK_LATLNG.lon);
  const moveOutPx = px(MOVE_OUT_LATLNG.lat, MOVE_OUT_LATLNG.lon);

  return createPortal(
    <div
      style={{ position: "absolute", inset: 0, zIndex: 500, pointerEvents: "none", overflow: "hidden" }}
    >
      {/* ── SVG layer: TTC arrows ─────────────────────────────────────────── */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible" }}>
        <defs>
          <marker id="cycle-head" markerWidth="10" markerHeight="7" refX="8" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#10b981" />
          </marker>
          <marker id="preference-head" markerWidth="10" markerHeight="7" refX="8" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
          </marker>
        </defs>

        {preferenceEdges.map((edge, index) => {
          const fromUnit = getUnitById(units, edge.fromUnitId);
          const toUnit = getUnitById(units, edge.toUnitId);
          if (!fromUnit || !toUnit || phase !== "ttc") return null;
          const fromPx = px(fromUnit.lat, fromUnit.lon);
          const toPx = px(toUnit.lat, toUnit.lon);
          const curve = buildCycleCurve(fromPx, toPx, index);
          const isInCycle = activeCycleHouseholdIds.has(edge.householdId);
          return (
            <motion.path
              key={`pref-${edge.householdId}-${edge.toUnitId}`}
              d={curve.path}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{
                pathLength: 1,
                opacity:
                  ttcStage === "preferences"
                    ? 0.82
                    : isInCycle && isCycleStage
                      ? 0.1
                      : 0.22,
              }}
              transition={{ duration: 0.55 }}
              stroke="#ef4444"
              strokeWidth={ttcStage === "preferences" ? 3.5 : 2.5}
              fill="none"
              markerEnd="url(#preference-head)"
              strokeLinecap="round"
              strokeDasharray="10 10"
            />
          );
        })}

        {cycleMoves.map((move, index) => {
          if (!move.from || !move.to || phase !== "ttc" || !isCycleStage) return null;
          const fromPx = px(move.from.lat, move.from.lon);
          const toPx = px(move.to.lat, move.to.lon);
          const curve = buildCycleCurve(fromPx, toPx, index);
          return (
            <g key={`${move.householdId}-${move.to.id}`}>
              <motion.path
                d={curve.path}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: ttcStage === "spotlight" ? 0.95 : 1 }}
                transition={{ duration: 0.7 }}
                stroke="rgba(16,185,129,0.16)"
                strokeWidth={ttcStage === "spotlight" ? 16 : 12}
                fill="none"
                strokeLinecap="round"
              />
              <motion.path
                d={curve.path}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: ttcStage === "spotlight" ? 0.92 : 1 }}
                transition={{ duration: 0.7 }}
                stroke="#10b981"
                strokeWidth={ttcStage === "spotlight" ? 5 : 4}
                fill="none"
                markerEnd="url(#cycle-head)"
                strokeLinecap="round"
              />
              <g transform={`translate(${curve.labelX}, ${curve.labelY})`}>
                <rect x="-30" y="-13" width="60" height="26" rx="13" fill="rgba(255,255,255,0.96)" stroke="rgba(16,185,129,0.32)" />
                <text x="0" y="5" textAnchor="middle" fill="#047857" fontSize="11" fontWeight="700" letterSpacing="0.18em">
                  {move.token}→{move.toToken}
                </text>
              </g>
            </g>
          );
        })}
      </svg>

      {/* ── Queue dock + move-out edge labels ─────────────────────────────── */}
      <div
        className="absolute z-10 rounded-full border border-white/70 bg-slate-950/92 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-white"
        style={{ left: dockPx.x - 52, top: dockPx.y - 24 }}
      >
        Queue dock
      </div>
      <div
        className="absolute z-10 rounded-full border border-white/70 bg-coral/92 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-white"
        style={{ left: moveOutPx.x - 74, top: moveOutPx.y - 42 }}
      >
        Move-out edge
      </div>

      {/* ── House markers ─────────────────────────────────────────────────── */}
      {units.map((unit) => {
        const occupant = getHouseholdById(households, unit.currentOccupantId);
        const baselineHouseholdId =
          fifoBaselineUnits?.find((e) => e.id === unit.id)?.currentOccupantId ?? null;
        const baselineHousehold = getHouseholdById(households, baselineHouseholdId);
        const result = occupant ? results[occupant.id] : undefined;
        const isSelected = selectedUnitId === unit.id;
        const rank = occupant ? getPreferenceRank(occupant, unit.id) : null;
        const isCycleRelated =
          activeCycleUnitIds.has(unit.id) ||
          activeCycleHouseholdIds.has(occupant?.id ?? "");
        const isDimmed =
          phase === "ttc" &&
          cycle &&
          isCycleStage &&
          occupant?.source === "fifo_queue" &&
          occupant.optedIn &&
          !isCycleRelated;
        const markerSize = unitCircleSize(unit.bedrooms);
        const cycleMove = cycleMoves.find((m) => m.householdId === occupant?.id);
        const canShowOptStatus =
          occupant?.source === "fifo_queue" &&
          (phase === "post_fifo" || phase === "ttc" || phase === "complete");

        const unitPx = px(unit.lat, unit.lon);

        return (
          <motion.div
            key={unit.id}
            layout
            data-map-interactive="true"
            onClick={() => router.push(`/house?id=${unit.siteId}`)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                router.push(`/house?id=${unit.siteId}`);
              }
            }}
            className={cn(
              "absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full transition focus:outline-none focus:ring-4 focus:ring-slate-900/15",
              isDimmed && "opacity-30",
            )}
            style={{
              left: unitPx.x,
              top: unitPx.y,
              width: markerSize,
              height: markerSize,
              transform: `translate(-50%, -50%) scale(${isSelected ? buildingScale(unit.bedrooms) + 0.08 : buildingScale(unit.bedrooms)})`,
              pointerEvents: "auto",
            }}
            title={`${unit.label} • ${occupant?.name ?? "Vacant"}`}
          >
            <span
              className={cn(
                "absolute inset-0 rounded-full border bg-white/88 shadow-[0_14px_32px_rgba(15,23,42,0.14)]",
                isSelected ? "border-slate-900 ring-8 ring-white/60" : "border-white/80",
                cycle && isCycleRelated && phase === "ttc" && isCycleStage && "ring-8 ring-emerald-300/35",
                result?.status === "improved" && phase === "complete" && "ring-8 ring-emerald-300/35",
              )}
            />
            <span className="absolute inset-0 flex items-center justify-center">
              <HouseGlyph
                bedrooms={unit.bedrooms}
                accessible={unit.accessible}
                active={Boolean(cycle && isCycleRelated && phase === "ttc" && isCycleStage)}
              />
            </span>
            {occupant ? (
              <button
                type="button"
                data-map-interactive="true"
                onClick={(e) => {
                  e.stopPropagation();
                  router.push(`/person?id=${occupant.id}`);
                }}
                className={cn(
                  "absolute -bottom-1 -right-1 flex h-6 min-w-6 items-center justify-center rounded-full border px-1 text-[10px] font-semibold shadow-sm cursor-pointer",
                  occupantTone(occupant, result, phase),
                )}
              >
                {occupant.name.split(" ").map((p) => p[0]).join("").slice(0, 2)}
              </button>
            ) : null}
            {canShowOptStatus ? (
              <button
                type="button"
                data-map-interactive="true"
                onClick={(e) => {
                  e.stopPropagation();
                  if (phase === "post_fifo" && occupant) {
                    onToggleHouseholdOptIn(occupant.id);
                  }
                }}
                className={cn(
                  "absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-bold shadow-sm",
                  occupant?.optedIn
                    ? "border-emerald-400 bg-emerald-500 text-white"
                    : "border-stone-300 bg-white text-stone-500",
                  phase === "post_fifo" && "cursor-pointer",
                )}
                title={phase === "post_fifo" ? "Toggle TTC participation" : "TTC participation"}
              >
                {occupant?.optedIn ? "✓" : "○"}
              </button>
            ) : null}
            {cycle && isCycleRelated && phase === "ttc" && isCycleStage ? (
              <span className="absolute -left-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-[10px] font-semibold text-white shadow-lg">
                {cycleMove?.token ?? ""}
              </span>
            ) : null}
            {cycleMove && phase === "ttc" && isCycleStage ? (
              <span className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-full border border-emerald-200 bg-white/95 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-800 shadow-sm">
                {cycleMove.token}: {cycleMove.fromLabel} wants {cycleMove.toToken}
              </span>
            ) : null}
            {isSelected ? (
              <span className="absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-full bg-slate-950 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-white shadow-lg">
                {unit.label}
              </span>
            ) : null}
            {rank !== null && occupant?.source === "fifo_queue" && phase === "complete" ? (
              <span className="absolute left-1/2 top-full mt-1.5 -translate-x-1/2 whitespace-nowrap text-[10px] font-medium uppercase tracking-[0.16em] text-slate-500">
                Rank {rank + 1}
              </span>
            ) : null}
            {comparisonMode && baselineHousehold && isSelected ? (
              <span className="absolute left-1/2 top-[calc(100%+2.5rem)] -translate-x-1/2 whitespace-nowrap rounded-full bg-white/90 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.16em] text-slate-600">
                FIFO baseline: {baselineHousehold.name}
              </span>
            ) : null}
          </motion.div>
        );
      })}

      {/* ── Floating move tokens ──────────────────────────────────────────── */}
      <AnimatePresence>
        {floatingMoves.map((move) => {
          const fromPx = px(move.from.lat, move.from.lon);
          const toPx = px(move.to.lat, move.to.lon);
          return (
            <motion.div
              key={move.id}
              initial={{ left: fromPx.x, top: fromPx.y, opacity: 0, scale: 0.84 }}
              animate={{
                left: toPx.x,
                top: toPx.y,
                opacity: [0, 1, 1, 0.18],
                scale: [0.84, 1, 1, 0.92],
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.74, ease: "easeInOut" }}
              className={cn(
                "absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-full px-4 py-2 text-sm font-semibold shadow-lg",
                move.tone === "depart" && "bg-coral text-white",
                move.tone === "arrive" && "bg-harbor text-cyan-950",
                move.tone === "cycle" && "bg-emerald-500 text-white",
              )}
            >
              {move.label}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>,
    map.getContainer(),
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

const DETROIT_BOUNDS: LatLngBoundsExpression = [
  [42.27, -83.32],
  [42.48, -82.88],
];

export function MapLeaflet(props: MapLeafletProps) {
  return (
    <MapContainer
      bounds={DETROIT_BOUNDS}
      boundsOptions={{ padding: [24, 24] }}
      style={{ width: "100%", height: "100%" }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      />
      {/* Small attribution in bottom-right */}
      <ZoomControls bounds={DETROIT_BOUNDS} />
      <MapOverlay {...props} />
    </MapContainer>
  );
}
