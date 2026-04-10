"use client";

import {
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { clamp, cn } from "@/lib/utils";
import { getHouseholdById, getPreferenceRank, getUnitById } from "@/lib/eligibility";
import {
  DISTRICTS,
  MAP_HEIGHT,
  MAP_WIDTH,
  MOVE_OUT_POINT,
  QUEUE_DOCK_POINT,
  ROAD_SEGMENTS,
} from "@/lib/map-layout";
import {
  FloatingMove,
  Household,
  HouseholdResult,
  HousingUnit,
  SimulationPhase,
  TtcCycle,
  TtcRound,
} from "@/types/housing";

interface MapCanvasProps {
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
  onSelectUnit: (unitId: string) => void;
  onClearSelection: () => void;
  onOpenHouseholdEditor: (householdId: string) => void;
  onToggleHouseholdOptIn: (householdId: string) => void;
}

const ROAD_PATHS = [
  "M 56 170 C 212 178, 334 192, 492 210 C 670 228, 886 196, 1086 188 C 1256 182, 1408 194, 1584 228",
  "M 58 330 C 212 344, 364 366, 534 364 C 710 362, 864 324, 1012 318 C 1200 308, 1370 332, 1568 360",
  "M 56 520 C 228 532, 356 548, 530 546 C 734 542, 894 508, 1108 504 C 1278 500, 1422 516, 1570 548",
  "M 64 756 C 248 742, 392 724, 576 730 C 780 738, 924 768, 1126 772 C 1294 776, 1442 754, 1574 734",
];

const STREET_SEGMENTS = [
  { x1: 210, y1: 112, x2: 210, y2: 930 },
  { x1: 392, y1: 112, x2: 392, y2: 930 },
  { x1: 700, y1: 92, x2: 700, y2: 952 },
  { x1: 876, y1: 92, x2: 876, y2: 952 },
  { x1: 1232, y1: 94, x2: 1232, y2: 944 },
  { x1: 1416, y1: 94, x2: 1416, y2: 944 },
];

const WATER_PATH =
  "M 74 972 C 258 920, 414 952, 620 896 C 820 842, 942 886, 1114 834 C 1298 780, 1418 820, 1560 760";

type ViewportState = {
  scale: number;
  x: number;
  y: number;
};

function occupantTone(
  occupant: Household | null,
  result: HouseholdResult | undefined,
  phase: SimulationPhase,
) {
  if (!occupant) {
    return "border-slate-200 bg-white/80 text-slate-500";
  }

  if (occupant.source === "original") {
    return "border-coral/50 bg-coral/15 text-rose-900";
  }

  if (phase === "ttc" && occupant.optedIn) {
    return "border-emerald-300 bg-emerald-50 text-emerald-900";
  }

  switch (result?.status) {
    case "improved":
      return "border-emerald-400 bg-emerald-50 text-emerald-900 ring-4 ring-emerald-300/35";
    case "opted_out":
      return "border-stone-300 bg-stone-100 text-stone-500";
    case "not_moved":
      return "border-amber-300 bg-amber-50 text-amber-800";
    case "unchanged":
      return "border-slate-300 bg-slate-100 text-slate-700";
    default:
      return "border-harbor/45 bg-harbor/15 text-cyan-900";
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
      <svg
        width="46"
        height="46"
        viewBox="0 0 48 48"
        className={cn(active && "drop-shadow-[0_0_12px_rgba(16,185,129,0.35)]")}
      >
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
      <svg
        width="42"
        height="42"
        viewBox="0 0 44 44"
        className={cn(active && "drop-shadow-[0_0_12px_rgba(16,185,129,0.35)]")}
      >
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
    <svg
      width="38"
      height="38"
      viewBox="0 0 40 40"
      className={cn(active && "drop-shadow-[0_0_12px_rgba(16,185,129,0.35)]")}
    >
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
    const fromUnit = units.find((unit) => unit.id === household?.currentUnitId);
    const toUnit = units.find((unit) => unit.id === cycle.targetUnitIds[index]);
    const token = String.fromCharCode(65 + index);

    return {
      householdId,
      token,
      label: household?.name ?? householdId,
      fromLabel: fromUnit?.label ?? "Current unit",
      toLabel: toUnit?.label ?? "Target unit",
      toToken: toUnit ? unitTokenMap.get(toUnit.id) ?? "?" : "?",
      from: fromUnit,
      to: toUnit,
    };
  });
}

function constrainViewport(
  nextViewport: ViewportState,
  width: number,
  height: number,
): ViewportState {
  const scaledWidth = MAP_WIDTH * nextViewport.scale;
  const scaledHeight = MAP_HEIGHT * nextViewport.scale;

  let x = nextViewport.x;
  let y = nextViewport.y;

  if (scaledWidth <= width) {
    x = (width - scaledWidth) / 2;
  } else {
    x = clamp(x, width - scaledWidth, 0);
  }

  if (scaledHeight <= height) {
    y = (height - scaledHeight) / 2;
  } else {
    y = clamp(y, height - scaledHeight, 0);
  }

  return {
    ...nextViewport,
    x,
    y,
  };
}

function fitViewport(width: number, height: number): ViewportState {
  const scale = clamp(Math.min(width / MAP_WIDTH, height / MAP_HEIGHT) * 0.95, 0.62, 1.1);
  return constrainViewport(
    {
      scale,
      x: (width - MAP_WIDTH * scale) / 2,
      y: (height - MAP_HEIGHT * scale) / 2,
    },
    width,
    height,
  );
}

export function MapCanvas({
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
  onSelectUnit,
  onClearSelection,
  onOpenHouseholdEditor,
  onToggleHouseholdOptIn,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);
  const [viewport, setViewport] = useState<ViewportState>({
    scale: 0.72,
    x: 44,
    y: 30,
  });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const applyFit = () => {
      const rect = node.getBoundingClientRect();
      setViewport((current) => {
        if (current.scale !== 0.72 || current.x !== 44 || current.y !== 30) {
          return constrainViewport(current, rect.width, rect.height);
        }

        return fitViewport(rect.width, rect.height);
      });
    };

    applyFit();
    const resizeObserver = new ResizeObserver(applyFit);
    resizeObserver.observe(node);
    return () => resizeObserver.disconnect();
  }, []);

  const cycle = useMemo(
    () => ttcRound?.cycles.find((entry) => entry.improvesCount > 0) ?? ttcRound?.cycles[0] ?? null,
    [ttcRound],
  );
  const cycleMoves = useMemo(
    () => activeCycleInfo(cycle, households, units),
    [cycle, households, units],
  );
  const preferenceEdges = useMemo(
    () => ttcRound?.edges.filter((edge) => edge.type === "preference") ?? [],
    [ttcRound],
  );
  const activeCycleHouseholdIds = new Set(cycle?.householdIds ?? []);
  const activeCycleUnitIds = new Set(
    cycleMoves.flatMap((move) => [move.from?.id, move.to?.id].filter(Boolean) as string[]),
  );
  const isCycleStage = ttcStage === "spotlight" || ttcStage === "moving";

  function adjustZoom(nextScale: number, clientX?: number, clientY?: number) {
    const node = containerRef.current;
    if (!node) return;

    const rect = node.getBoundingClientRect();
    const clampedScale = clamp(nextScale, 0.55, 3.2);

    setViewport((current) => {
      const originX =
        clientX !== undefined ? clientX - rect.left : rect.width / 2;
      const originY =
        clientY !== undefined ? clientY - rect.top : rect.height / 2;
      const worldX = (originX - current.x) / current.scale;
      const worldY = (originY - current.y) / current.scale;
      const nextViewport = {
        scale: clampedScale,
        x: originX - worldX * clampedScale,
        y: originY - worldY * clampedScale,
      };
      return constrainViewport(nextViewport, rect.width, rect.height);
    });
  }

  function handleWheel(event: ReactWheelEvent<HTMLDivElement>) {
    event.preventDefault();
    const factor = event.deltaY > 0 ? 0.92 : 1.08;
    adjustZoom(viewport.scale * factor, event.clientX, event.clientY);
  }

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement;
    if (target.closest("[data-map-interactive='true']")) {
      return;
    }

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: viewport.x,
      originY: viewport.y,
      moved: false,
    };
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    const node = containerRef.current;
    if (!drag || !node || drag.pointerId !== event.pointerId) {
      return;
    }

    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      drag.moved = true;
    }

    const rect = node.getBoundingClientRect();
    setViewport(
      constrainViewport(
        {
          scale: viewport.scale,
          x: drag.originX + dx,
          y: drag.originY + dy,
        },
        rect.width,
        rect.height,
      ),
    );
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) {
      return;
    }

    const target = event.target as HTMLElement;
    if (!drag.moved && !target.closest("[data-map-interactive='true']")) {
      onClearSelection();
    }

    dragRef.current = null;
    setIsDragging(false);
  }

  return (
    <section className="panel-surface flex h-[calc(100vh-12rem)] min-h-[760px] flex-col rounded-[34px] p-4">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500">
            Main visualization
          </div>
          <div className="display-font text-4xl text-ink">Allocation map</div>
        </div>
        <div className="max-w-2xl text-sm text-slate-600">
          Drag to move, scroll to zoom, and click empty map space to clear a selection. During TTC, red arrows show each unsettled household&apos;s top reachable home, then the chosen cycle turns green before the movement begins.
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden rounded-[30px] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.82),rgba(236,244,246,0.95))]">
        <div className="absolute left-4 top-4 z-30 rounded-[22px] border border-white/70 bg-white/82 px-4 py-3 shadow-[0_18px_46px_rgba(15,23,42,0.14)] backdrop-blur">
          <div className="text-[11px] font-medium uppercase tracking-[0.24em] text-slate-500">
            Map controls
          </div>
          <div className="mt-2 flex items-center gap-2">
            <button
              data-map-interactive="true"
              onClick={() => adjustZoom(viewport.scale - 0.18)}
              className="rounded-full bg-slate-950 px-3 py-2 text-sm font-semibold text-white"
            >
              -
            </button>
            <div className="rounded-full bg-slate-100 px-3 py-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-600">
              {viewport.scale.toFixed(2)}x
            </div>
            <button
              data-map-interactive="true"
              onClick={() => adjustZoom(viewport.scale + 0.18)}
              className="rounded-full bg-slate-950 px-3 py-2 text-sm font-semibold text-white"
            >
              +
            </button>
            <button
              data-map-interactive="true"
              onClick={() => {
                const node = containerRef.current;
                if (!node) return;
                const rect = node.getBoundingClientRect();
                setViewport(fitViewport(rect.width, rect.height));
              }}
              className="rounded-full border border-slate-300 px-3 py-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-600"
            >
              Reset
            </button>
          </div>
        </div>

        <div
          ref={containerRef}
          className={cn(
            "relative h-full w-full overflow-hidden",
            isDragging ? "cursor-grabbing" : "cursor-grab",
          )}
          onWheel={handleWheel}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div
            className="absolute left-0 top-0 h-[1080px] w-[1640px] origin-top-left"
            style={{
              transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
            }}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.9),transparent_28%),linear-gradient(180deg,rgba(248,246,238,0.98),rgba(228,238,242,0.95))]" />
            <div
              className="absolute inset-0 opacity-60"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 16% 18%, rgba(255,255,255,0.62), transparent 11%), radial-gradient(circle at 74% 24%, rgba(255,255,255,0.5), transparent 14%), radial-gradient(circle at 54% 78%, rgba(255,255,255,0.4), transparent 15%)",
              }}
            />
            <div className="map-grid absolute inset-0 opacity-15" />

            <svg className="absolute inset-0 h-full w-full">
              <defs>
                <filter id="road-shadow">
                  <feDropShadow
                    dx="0"
                    dy="2"
                    stdDeviation="3"
                    floodColor="rgba(15,23,42,0.16)"
                  />
                </filter>
                <marker
                  id="cycle-head"
                  markerWidth="10"
                  markerHeight="7"
                  refX="8"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill="#10b981" />
                </marker>
                <marker
                  id="preference-head"
                  markerWidth="10"
                  markerHeight="7"
                  refX="8"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
                </marker>
              </defs>

              {DISTRICTS.map((district) => (
                <g key={district.id}>
                  <rect
                    x={district.x}
                    y={district.y}
                    width={district.width}
                    height={district.height}
                    rx="42"
                    fill={district.tone}
                    stroke="rgba(255,255,255,0.75)"
                    strokeWidth="2"
                  />
                  <text
                    x={district.x + 28}
                    y={district.y + 34}
                    fill="rgba(18,32,51,0.45)"
                    fontSize="18"
                    fontWeight="600"
                    letterSpacing="0.18em"
                  >
                    {district.label.toUpperCase()}
                  </text>
                </g>
              ))}

              {ROAD_SEGMENTS.map((road) => (
                <g key={road.id} filter="url(#road-shadow)">
                  <line
                    x1={road.x1}
                    y1={road.y1}
                    x2={road.x2}
                    y2={road.y2}
                    stroke="rgba(160, 171, 186, 0.34)"
                    strokeWidth={road.width + 6}
                    strokeLinecap="round"
                  />
                  <line
                    x1={road.x1}
                    y1={road.y1}
                    x2={road.x2}
                    y2={road.y2}
                    stroke="rgba(255, 255, 255, 0.98)"
                    strokeWidth={road.width}
                    strokeLinecap="round"
                  />
                  <line
                    x1={road.x1}
                    y1={road.y1}
                    x2={road.x2}
                    y2={road.y2}
                    stroke="rgba(207, 217, 229, 0.48)"
                    strokeWidth="2"
                    strokeDasharray="12 14"
                    strokeLinecap="round"
                  />
                </g>
              ))}

              {ROAD_PATHS.map((path, index) => (
                <g key={path} filter="url(#road-shadow)">
                  <path d={path} fill="none" stroke="rgba(160, 171, 186, 0.28)" strokeWidth="22" strokeLinecap="round" />
                  <path d={path} fill="none" stroke="rgba(255,255,255,0.98)" strokeWidth="16" strokeLinecap="round" />
                  <path d={path} fill="none" stroke="rgba(207, 217, 229, 0.48)" strokeWidth="2" strokeDasharray="12 16" strokeLinecap="round" />
                  <text
                    x={122 + index * 330}
                    y={index < 2 ? 150 + index * 170 : 660 + (index - 2) * 92}
                    fill="rgba(79,97,120,0.62)"
                    fontSize="12"
                    fontWeight="600"
                    letterSpacing="0.16em"
                  >
                    {["LAKESHORE AVE", "MARKET BLVD", "RIVERLINE RD", "GARDEN PKWY"][index]}
                  </text>
                </g>
              ))}

              {STREET_SEGMENTS.map((street) => (
                <g key={`${street.x1}-${street.y1}`}>
                  <line
                    x1={street.x1}
                    y1={street.y1}
                    x2={street.x2}
                    y2={street.y2}
                    stroke="rgba(255,255,255,0.72)"
                    strokeWidth="8"
                    strokeLinecap="round"
                  />
                  <line
                    x1={street.x1}
                    y1={street.y1}
                    x2={street.x2}
                    y2={street.y2}
                    stroke="rgba(207, 217, 229, 0.46)"
                    strokeWidth="1.5"
                    strokeDasharray="8 14"
                    strokeLinecap="round"
                  />
                </g>
              ))}

              <path
                d={WATER_PATH}
                fill="none"
                stroke="rgba(107, 163, 212, 0.42)"
                strokeWidth="22"
                strokeLinecap="round"
              />
              <path
                d={WATER_PATH}
                fill="none"
                stroke="rgba(255,255,255,0.45)"
                strokeWidth="4"
                strokeLinecap="round"
              />

              {preferenceEdges.map((edge, index) => {
                const fromUnit = getUnitById(units, edge.fromUnitId);
                const toUnit = getUnitById(units, edge.toUnitId);
                if (!fromUnit || !toUnit || phase !== "ttc") return null;
                const curve = buildCycleCurve(
                  { x: fromUnit.x, y: fromUnit.y },
                  { x: toUnit.x, y: toUnit.y },
                  index,
                );
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
                const curve = buildCycleCurve(
                  { x: move.from.x, y: move.from.y },
                  { x: move.to.x, y: move.to.y },
                  index,
                );

                return (
                  <g key={`${move.householdId}-${move.to.id}`}>
                    <motion.path
                      d={curve.path}
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{
                        pathLength: 1,
                        opacity: ttcStage === "spotlight" ? 0.95 : 1,
                      }}
                      transition={{ duration: 0.7 }}
                      stroke="rgba(16,185,129,0.16)"
                      strokeWidth={ttcStage === "spotlight" ? 16 : 12}
                      fill="none"
                      strokeLinecap="round"
                    />
                    <motion.path
                      d={curve.path}
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{
                        pathLength: 1,
                        opacity: ttcStage === "spotlight" ? 0.92 : 1,
                      }}
                      transition={{ duration: 0.7 }}
                      stroke="#10b981"
                      strokeWidth={ttcStage === "spotlight" ? 5 : 4}
                      fill="none"
                      markerEnd="url(#cycle-head)"
                      strokeLinecap="round"
                    />
                    <g transform={`translate(${curve.labelX}, ${curve.labelY})`}>
                      <rect
                        x="-30"
                        y="-13"
                        width="60"
                        height="26"
                        rx="13"
                        fill="rgba(255,255,255,0.96)"
                        stroke="rgba(16,185,129,0.32)"
                      />
                      <text
                        x="0"
                        y="5"
                        textAnchor="middle"
                        fill="#047857"
                        fontSize="11"
                        fontWeight="700"
                        letterSpacing="0.18em"
                      >
                        {move.token}→{move.toToken}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>

            <div
              className="absolute z-10 rounded-full border border-white/70 bg-slate-950/92 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-white"
              style={{ left: QUEUE_DOCK_POINT.x - 52, top: QUEUE_DOCK_POINT.y - 24 }}
            >
              Queue dock
            </div>
            <div
              className="absolute z-10 rounded-full border border-white/70 bg-coral/92 px-4 py-2 text-xs font-medium uppercase tracking-[0.2em] text-white"
              style={{ left: MOVE_OUT_POINT.x - 74, top: MOVE_OUT_POINT.y - 42 }}
            >
              Move-out edge
            </div>

            {units.map((unit) => {
              const occupant = getHouseholdById(households, unit.currentOccupantId);
              const baselineHouseholdId =
                fifoBaselineUnits?.find((entry) => entry.id === unit.id)?.currentOccupantId ?? null;
              const baselineHousehold = getHouseholdById(households, baselineHouseholdId);
              const result = occupant ? results[occupant.id] : undefined;
              const isSelected = selectedUnitId === unit.id;
              const rank = occupant ? getPreferenceRank(occupant, unit.id) : null;
              const isCycleRelated =
                activeCycleUnitIds.has(unit.id) || activeCycleHouseholdIds.has(occupant?.id ?? "");
              const isDimmed =
                phase === "ttc" &&
                cycle &&
                isCycleStage &&
                occupant?.source === "fifo_queue" &&
                occupant.optedIn &&
                !isCycleRelated;
              const markerSize = unitCircleSize(unit.bedrooms);
              const cycleMove = cycleMoves.find((move) => move.householdId === occupant?.id);
              const canShowOptStatus =
                occupant?.source === "fifo_queue" &&
                (phase === "post_fifo" || phase === "ttc" || phase === "complete");

              return (
                <motion.div
                  key={unit.id}
                  layout
                  data-map-interactive="true"
                  onClick={() => onSelectUnit(unit.id)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelectUnit(unit.id);
                    }
                  }}
                  className={cn(
                    "absolute z-10 -translate-x-1/2 -translate-y-1/2 rounded-full transition focus:outline-none focus:ring-4 focus:ring-slate-900/15",
                    isDimmed && "opacity-30",
                  )}
                  style={{
                    left: unit.x,
                    top: unit.y,
                    width: markerSize,
                    height: markerSize,
                    transform: `translate(-50%, -50%) scale(${isSelected ? buildingScale(unit.bedrooms) + 0.08 : buildingScale(unit.bedrooms)})`,
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
                      onClick={(event) => {
                        event.stopPropagation();
                        if (occupant.source === "fifo_queue") {
                          onOpenHouseholdEditor(occupant.id);
                        }
                      }}
                      className={cn(
                        "absolute -bottom-1 -right-1 flex h-6 min-w-6 items-center justify-center rounded-full border px-1 text-[10px] font-semibold shadow-sm",
                        occupantTone(occupant, result, phase),
                        occupant.source === "fifo_queue" && "cursor-pointer",
                      )}
                    >
                      {occupant.name
                        .split(" ")
                        .map((part) => part[0])
                        .join("")
                        .slice(0, 2)}
                    </button>
                  ) : null}
                  {canShowOptStatus ? (
                    <button
                      type="button"
                      data-map-interactive="true"
                      onClick={(event) => {
                        event.stopPropagation();
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

            <AnimatePresence>
              {floatingMoves.map((move) => (
                <motion.div
                  key={move.id}
                  initial={{
                    left: move.from.x,
                    top: move.from.y,
                    opacity: 0,
                    scale: 0.84,
                  }}
                  animate={{
                    left: move.to.x,
                    top: move.to.y,
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
              ))}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
