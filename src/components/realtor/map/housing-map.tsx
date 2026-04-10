"use client";

import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import { ScoredListing } from "@/lib/realtor/types";
import { DETROIT_POIS, POI_COLORS, POI_LABELS, PointOfInterest } from "./detroit-pois";
import "leaflet/dist/leaflet.css";

const DETROIT_CENTER: [number, number] = [42.365, -83.08];
const DEFAULT_ZOOM = 12;
const SELECTED_ZOOM = 15;

function createListingIcon(rank: number, selected: boolean) {
  const bg = selected ? "#3d7a71" : rank <= 3 ? "#5ba89d" : rank <= 10 ? "#7cb8b2" : "#8a9bae";
  const size = selected ? 36 : 28;

  return L.divIcon({
    className: "",
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${bg};
      color:white;
      border-radius:50%;
      display:flex;align-items:center;justify-content:center;
      font-size:${selected ? 14 : 11}px;font-weight:700;
      border:2px solid white;
      box-shadow:0 2px 6px rgba(0,0,0,0.3);
      transition:all 0.2s;
      ${selected ? "z-index:1000;" : ""}
    ">${rank}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function createPoiIcon(type: PointOfInterest["type"]) {
  const color = POI_COLORS[type];
  return L.divIcon({
    className: "",
    html: `<div style="
      width:10px;height:10px;
      background:${color};
      border-radius:50%;
      border:1.5px solid white;
      box-shadow:0 1px 3px rgba(0,0,0,0.25);
      opacity:0.8;
    "></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
  });
}

function FlyToSelected({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  const prevRef = useRef<string>("");

  useEffect(() => {
    const key = `${lat},${lng}`;
    if (key !== prevRef.current) {
      prevRef.current = key;
      map.flyTo([lat, lng], SELECTED_ZOOM, { duration: 0.8 });
    }
  }, [lat, lng, map]);

  return null;
}

interface HousingMapProps {
  results: ScoredListing[];
  selectedSiteId: string | null;
  onSelectListing: (siteId: string) => void;
}

export function HousingMap({
  results,
  selectedSiteId,
  onSelectListing,
}: HousingMapProps) {
  const [poiFilter, setPoiFilter] = useState<Set<PointOfInterest["type"]>>(
    new Set(["hospital", "transit", "school", "government"]),
  );

  function togglePoi(type: PointOfInterest["type"]) {
    setPoiFilter((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }

  const selectedResult = results.find((r) => r.listing.site_id === selectedSiteId);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(POI_LABELS) as PointOfInterest["type"][]).map((type) => (
          <button
            key={type}
            onClick={() => togglePoi(type)}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-opacity focus-visible:outline-none focus-visible:ring-2"
            style={{
              border: "1px solid var(--line)",
              opacity: poiFilter.has(type) ? 1 : 0.4,
              color: "var(--ink-1)",
            }}
          >
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ background: POI_COLORS[type] }}
            />
            {POI_LABELS[type]}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-xl" style={{ border: "1px solid var(--line)", height: "100%" }}>
        <MapContainer
          center={DETROIT_CENTER}
          zoom={DEFAULT_ZOOM}
          scrollWheelZoom={true}
          style={{ height: "100%", minHeight: "500px", width: "100%" }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {selectedResult && (
            <FlyToSelected
              lat={selectedResult.listing.coordinates.y}
              lng={selectedResult.listing.coordinates.x}
            />
          )}

          {results.map((result, index) => {
            const { listing } = result;
            const rank = index + 1;
            const isSelected = listing.site_id === selectedSiteId;

            return (
              <Marker
                key={listing.site_id}
                position={[listing.coordinates.y, listing.coordinates.x]}
                icon={createListingIcon(rank, isSelected)}
                eventHandlers={{
                  click: () => onSelectListing(listing.site_id),
                }}
              >
                <Popup>
                  <div style={{ minWidth: 160 }}>
                    <strong>#{rank} {listing.site_name}</strong>
                    <br />
                    <span style={{ fontSize: 12, color: "#666" }}>{listing.address}</span>
                    <br />
                    <span style={{ fontSize: 12 }}>
                      {listing.unit.bedrooms} bed &middot; ${listing.cost.monthly_rent}/mo
                      &middot; Score: {Math.round(result.totalScore)}
                    </span>
                  </div>
                </Popup>
              </Marker>
            );
          })}

          {DETROIT_POIS.filter((poi) => poiFilter.has(poi.type)).map((poi) => (
            <Marker
              key={`${poi.type}-${poi.name}`}
              position={[poi.lat, poi.lng]}
              icon={createPoiIcon(poi.type)}
            >
              <Popup>
                <strong>{poi.name}</strong>
                <br />
                <span style={{ fontSize: 12, color: POI_COLORS[poi.type] }}>
                  {POI_LABELS[poi.type]}
                </span>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
