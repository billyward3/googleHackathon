"use client";

import dynamic from "next/dynamic";
import type { MapLeafletProps } from "./map-leaflet";

// Leaflet accesses `window` at module load time — must be client-only
const MapLeaflet = dynamic(
  () => import("./map-leaflet").then((m) => ({ default: m.MapLeaflet })),
  { ssr: false },
);

export type MapCanvasProps = MapLeafletProps;

export function MapCanvas(props: MapCanvasProps) {
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
          Drag to pan, scroll to zoom, click a house to see details. During TTC, red arrows show each
          household&apos;s top reachable home; the chosen cycle turns green before moves execute.
        </div>
      </div>

      <div className="relative flex-1 overflow-hidden rounded-[30px] border border-white/70">
        <MapLeaflet {...props} />
      </div>
    </section>
  );
}
