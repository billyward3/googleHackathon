"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Reorder } from "framer-motion";
import { ScoredListing, TenantProfile } from "@/lib/realtor/types";
import { saveRankings, saveProfile } from "@/lib/realtor/rankings-store";
import { ListingCard } from "./listing-card";

const HousingMap = dynamic(
  () => import("./map/housing-map").then((mod) => mod.HousingMap),
  { ssr: false, loading: () => <MapPlaceholder /> },
);

function MapPlaceholder() {
  return (
    <div
      className="flex items-center justify-center rounded-xl"
      style={{ height: "100%", minHeight: 500, background: "var(--bg-2)", border: "1px solid var(--line)" }}
    >
      <p style={{ color: "var(--ink-2)" }}>Loading map...</p>
    </div>
  );
}

interface ResultsPanelProps {
  results: ScoredListing[];
  profile: TenantProfile;
  onStartOver: () => void;
}

export function ResultsPanel({ results: initialResults, profile, onStartOver }: ResultsPanelProps) {
  const router = useRouter();
  const [ranked, setRanked] = useState<ScoredListing[]>(initialResults);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(
    initialResults[0]?.listing.site_id ?? null,
  );
  const [saved, setSaved] = useState(false);

  const selectedResult = ranked.find((r) => r.listing.site_id === selectedSiteId);

  function handleReorder(newOrder: ScoredListing[]) {
    setRanked(newOrder);
    setSaved(false);
  }

  function persistAll() {
    const siteIds = ranked.map((r) => r.listing.site_id);
    saveRankings(siteIds);
    saveProfile(profile);
    setSaved(true);
  }

  function handleSaveAndSimulate() {
    persistAll();
    router.push("/");
  }

  function handleSave() {
    persistAll();
  }

  return (
    <div className="mx-auto flex max-w-[1600px] flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2
            className="display-font text-2xl font-semibold md:text-3xl"
            style={{ color: "var(--ink-1)" }}
          >
            Rank your preferences
          </h2>
          <p className="mt-1 text-base" style={{ color: "var(--ink-2)" }}>
            {ranked.length === 0
              ? "No listings found. Try adjusting your preferences."
              : `${ranked.length} home${ranked.length === 1 ? "" : "s"} in Detroit. Use arrows to reorder, then save your rankings.`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onStartOver}
            className="rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2"
            style={{ border: "1px solid var(--line)", color: "var(--ink-2)" }}
          >
            Start over
          </button>
          <button
            onClick={handleSave}
            className="rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2"
            style={{ border: "1px solid var(--line)", color: saved ? "#5ba89d" : "var(--ink-1)" }}
          >
            {saved ? "Saved" : "Save rankings"}
          </button>
          <button
            onClick={handleSaveAndSimulate}
            className="rounded-xl px-5 py-2 text-sm font-semibold text-white transition-all focus-visible:outline-none focus-visible:ring-2"
            style={{ background: "linear-gradient(135deg, #5ba89d, #4a8f86)" }}
          >
            Save &amp; run simulation →
          </button>
        </div>
      </div>

      {ranked.length > 0 && (
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          {/* Left: draggable ranking list */}
          <Reorder.Group
            axis="y"
            values={ranked}
            onReorder={handleReorder}
            className="soft-scrollbar flex flex-col gap-2 overflow-y-auto"
            style={{ maxHeight: "calc(100vh - 160px)" }}
          >
            {ranked.map((result, index) => (
              <Reorder.Item
                key={result.listing.site_id}
                value={result}
                className="flex cursor-grab items-center gap-2 active:cursor-grabbing"
                onClick={() => setSelectedSiteId(result.listing.site_id)}
              >
                <div
                  className="flex flex-shrink-0 flex-col items-center justify-center rounded-lg px-1 py-2"
                  style={{ color: "var(--ink-2)" }}
                >
                  <svg width="12" height="16" viewBox="0 0 12 16" fill="currentColor" opacity="0.4">
                    <circle cx="3" cy="2" r="1.5" />
                    <circle cx="9" cy="2" r="1.5" />
                    <circle cx="3" cy="8" r="1.5" />
                    <circle cx="9" cy="8" r="1.5" />
                    <circle cx="3" cy="14" r="1.5" />
                    <circle cx="9" cy="14" r="1.5" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <ListingCard
                    scored={result}
                    rank={index + 1}
                    selected={result.listing.site_id === selectedSiteId}
                  />
                </div>
              </Reorder.Item>
            ))}
          </Reorder.Group>

          {/* Right: map + detail */}
          <div className="flex flex-col gap-4" style={{ position: "sticky", top: 80, alignSelf: "start" }}>
            <HousingMap
              results={ranked}
              selectedSiteId={selectedSiteId}
              onSelectListing={setSelectedSiteId}
            />

            {selectedResult && (
              <SelectedDetail scored={selectedResult} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SelectedDetail({ scored }: { scored: ScoredListing }) {
  const { listing } = scored;
  const totalCost = listing.cost.monthly_rent + listing.cost.utilities;

  const DEMO_IMAGES = [
    "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=600&h=300&fit=crop",
    "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=600&h=300&fit=crop",
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&h=300&fit=crop",
    "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=600&h=300&fit=crop",
    "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=300&fit=crop",
  ];

  const imageIndex = listing.site_id.split("").reduce((sum, c) => sum + c.charCodeAt(0), 0) % DEMO_IMAGES.length;

  return (
    <div className="panel-surface flex flex-col gap-4 overflow-hidden rounded-xl">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={DEMO_IMAGES[imageIndex]}
        alt={`${listing.site_name} exterior`}
        className="h-44 w-full object-cover"
      />

      <div className="flex flex-col gap-3 px-5 pb-5">
        <div>
          <h3 className="text-xl font-semibold" style={{ color: "var(--ink-1)" }}>
            {listing.site_name}
          </h3>
          <p className="text-sm" style={{ color: "var(--ink-2)" }}>
            {listing.address}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          <Tag label={`${listing.unit.bedrooms} bed / ${listing.unit.bathrooms} bath`} />
          <Tag label={`${listing.unit.square_footage.toLocaleString()} sqft`} />
          <Tag label={`$${listing.cost.monthly_rent.toLocaleString()}/mo rent`} />
          <Tag label={`$${totalCost.toLocaleString()}/mo total`} />
          <Tag label={listing.unit.unit_type} />
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
          <Detail label="Stairs" value={listing.accessibility.stairs} />
          <Detail label="Wheelchair" value={listing.accessibility.wheelchair_access ? "Yes" : "No"} />
          <Detail label="Senior-friendly" value={listing.accessibility.elderly_friendly_layout ? "Yes" : "No"} />
          <Detail label="Bus access" value={listing.location.bus_access} />
          <Detail label="Transit" value={`${listing.location.distance_to_transit} mi`} />
          <Detail label="Parking" value={listing.location.parking > 0 ? `${listing.location.parking} spot${listing.location.parking > 1 ? "s" : ""}` : "None"} />
          <Detail label="Pets" value={listing.amenities.pet_friendliness ? "Allowed" : "No"} />
          <Detail label="Laundry" value={listing.amenities.laundry} />
          <Detail label="AC" value={listing.amenities.ac} />
          <Detail label="Condition" value={`${listing.quality.house_condition}/10`} />
          <Detail label="Developer" value={listing.owner_developer_name} />
          <Detail label="Construction" value={listing.construction_type} />
        </div>

        {scored.warnings.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {scored.warnings.map((w) => (
              <span
                key={w}
                className="rounded-lg px-2 py-1 text-xs font-medium"
                style={{ background: "rgba(194, 93, 93, 0.1)", color: "#a04545" }}
              >
                {w}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Tag({ label }: { label: string }) {
  return (
    <span
      className="rounded-lg px-2.5 py-1 text-sm font-medium"
      style={{ background: "rgba(91, 168, 157, 0.1)", color: "var(--ink-1)" }}
    >
      {label}
    </span>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span style={{ color: "var(--ink-2)" }}>{label}: </span>
      <span className="font-medium" style={{ color: "var(--ink-1)" }}>{value}</span>
    </div>
  );
}
