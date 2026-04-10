"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { getHouseById, getNextHouseId, CsvHouse } from "@/data/housingData";

function StarRating({ value }: { value: number }) {
  return (
    <span className="text-amber-400">
      {"★".repeat(Math.round(value / 2))}
      {"☆".repeat(5 - Math.round(value / 2))}
    </span>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
        {label}
      </div>
      <div className="text-sm text-slate-900">{children}</div>
    </div>
  );
}

function EditableField({
  label,
  value,
  type,
  onChange,
  min,
  max,
}: {
  label: string;
  value: string | number;
  type: "text" | "number";
  onChange: (val: string) => void;
  min?: number;
  max?: number;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>
      <input
        type={type}
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
      />
    </label>
  );
}

function EditableSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (val: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function EditableCheckbox({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (val: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2">
      <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-slate-900"
      />
    </label>
  );
}

function HousePageContent() {
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get("id") ?? "";

  const base = getHouseById(id);
  const nextId = getNextHouseId(id);

  const [house, setHouse] = useState<CsvHouse | null>(base ?? null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(`house:${id}`) : null;
    if (stored) {
      setHouse(JSON.parse(stored));
    } else if (base) {
      setHouse(base);
    }
  }, [id, base]);

  if (!house) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-400">
        House not found.
      </div>
    );
  }

  function patch(field: keyof CsvHouse, value: unknown) {
    setHouse((prev) => (prev ? { ...prev, [field]: value } : prev));
    setSaved(false);
  }

  function save() {
    if (house) {
      localStorage.setItem(`house:${id}`, JSON.stringify(house));
      setSaved(true);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <button
              onClick={() => router.back()}
              className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-400 hover:text-slate-700"
            >
              ← Back
            </button>
            <div className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">
              {house.neighborhood}
            </div>
            <h1 className="text-3xl font-bold text-slate-900">{house.siteName}</h1>
            <div className="mt-1 text-sm text-slate-500">{house.address}</div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={save}
              className="rounded-full bg-slate-900 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-white hover:bg-slate-700"
            >
              {saved ? "Saved ✓" : "Save changes"}
            </button>
            {nextId && (
              <button
                onClick={() => router.push(`/house?id=${nextId}`)}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-600 hover:bg-slate-50"
              >
                Next house →
              </button>
            )}
          </div>
        </div>

        {/* Identity */}
        <section className="mb-4 rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Identity
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Site ID">{house.id}</Field>
            <Field label="Object ID">{house.objectId}</Field>
            <Field label="Owner / Developer">{house.ownerDeveloper}</Field>
            <Field label="Construction type">{house.constructionType}</Field>
            <Field label="Unit type">{house.unitType}</Field>
          </div>
        </section>

        {/* Physical */}
        <section className="mb-4 rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Physical
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <EditableField
              label="Bedrooms"
              type="number"
              value={house.bedrooms}
              min={0}
              max={10}
              onChange={(v) => patch("bedrooms", Number(v))}
            />
            <EditableField
              label="Bathrooms"
              type="number"
              value={house.bathrooms}
              min={0}
              max={10}
              onChange={(v) => patch("bathrooms", Number(v))}
            />
            <EditableField
              label="Square footage"
              type="number"
              value={house.squareFootage}
              min={0}
              onChange={(v) => patch("squareFootage", Number(v))}
            />
            <EditableSelect
              label="Stairs"
              value={house.stairs}
              options={["none", "few", "one flight", "two flights"]}
              onChange={(v) => patch("stairs", v)}
            />
            <EditableSelect
              label="House condition (1–10)"
              value={String(house.houseCondition)}
              options={["1","2","3","4","5","6","7","8","9","10"]}
              onChange={(v) => patch("houseCondition", Number(v))}
            />
            <EditableSelect
              label="Maintenance burden"
              value={house.maintenanceBurden}
              options={["low", "medium", "high"]}
              onChange={(v) => patch("maintenanceBurden", v)}
            />
            <EditableSelect
              label="Appliances"
              value={house.appliances}
              options={["new", "modern", "stainless", "standard", "mixed", "older"]}
              onChange={(v) => patch("appliances", v)}
            />
            <EditableSelect
              label="Repairs needed"
              value={house.repairsNeeded}
              options={["none", "minor", "moderate", "major"]}
              onChange={(v) => patch("repairsNeeded", v)}
            />
          </div>
        </section>

        {/* Financial */}
        <section className="mb-4 rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Financial
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <EditableField
              label="Monthly rent ($)"
              type="number"
              value={house.monthlyRent}
              min={0}
              onChange={(v) => patch("monthlyRent", Number(v))}
            />
            <EditableField
              label="Utilities ($/mo)"
              type="number"
              value={house.utilities}
              min={0}
              onChange={(v) => patch("utilities", Number(v))}
            />
            <EditableSelect
              label="Lease security"
              value={house.leaseSecurity}
              options={["low", "medium", "high"]}
              onChange={(v) => patch("leaseSecurity", v)}
            />
          </div>
        </section>

        {/* Ratings */}
        <section className="mb-4 rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Ratings (1–10)
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {(
              [
                ["Safety", "safety"],
                ["Noise", "noise"],
                ["Cleanliness", "cleanliness"],
                ["Vibe", "vibe"],
                ["School quality", "schoolQuality"],
              ] as [string, keyof CsvHouse][]
            ).map(([label, key]) => (
              <div key={key} className="flex flex-col gap-1">
                <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
                  {label}
                </span>
                <select
                  value={house[key] as number}
                  onChange={(e) => patch(key, Number(e.target.value))}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                >
                  {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <StarRating value={house[key] as number} />
              </div>
            ))}
          </div>
        </section>

        {/* Accessibility */}
        <section className="mb-4 rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Accessibility &amp; amenities
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <EditableCheckbox
              label="Wheelchair access"
              value={house.wheelchairAccess}
              onChange={(v) => patch("wheelchairAccess", v)}
            />
            <EditableCheckbox
              label="Elderly-friendly layout"
              value={house.elderlyFriendlyLayout}
              onChange={(v) => patch("elderlyFriendlyLayout", v)}
            />
            <EditableCheckbox
              label="Balcony"
              value={house.balcony}
              onChange={(v) => patch("balcony", v)}
            />
            <EditableCheckbox
              label="Nearby park"
              value={house.nearbyPark}
              onChange={(v) => patch("nearbyPark", v)}
            />
            <EditableCheckbox
              label="Pet-friendly"
              value={house.petFriendly}
              onChange={(v) => patch("petFriendly", v)}
            />
            <EditableSelect
              label="A/C"
              value={house.ac}
              options={["none", "window", "central", "mini-split"]}
              onChange={(v) => patch("ac", v)}
            />
            <EditableSelect
              label="Laundry"
              value={house.laundry}
              options={["none", "on-site", "in-unit"]}
              onChange={(v) => patch("laundry", v)}
            />
            <EditableField
              label="Parking spaces"
              type="number"
              value={house.parking}
              min={0}
              onChange={(v) => patch("parking", Number(v))}
            />
            <EditableSelect
              label="Yard"
              value={house.yard}
              options={["none", "small", "medium", "large", "shared"]}
              onChange={(v) => patch("yard", v)}
            />
            <EditableSelect
              label="Backyard"
              value={house.backyard}
              options={["none", "small", "medium", "large", "shared"]}
              onChange={(v) => patch("backyard", v)}
            />
            <EditableSelect
              label="Storage"
              value={house.storage}
              options={["none", "closet", "hall closet", "storage locker", "basement", "shed", "garage"]}
              onChange={(v) => patch("storage", v)}
            />
            <EditableSelect
              label="Internet quality"
              value={house.internetQuality}
              options={["poor", "fair", "good", "fiber"]}
              onChange={(v) => patch("internetQuality", v)}
            />
          </div>
        </section>

        {/* Location */}
        <section className="mb-4 rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Location &amp; transit
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="Neighborhood">{house.neighborhood}</Field>
            <Field label="School zone">{house.schoolZone}</Field>
            <EditableSelect
              label="Bus access"
              value={house.busAccess}
              options={["none", "limited", "moderate", "strong", "excellent"]}
              onChange={(v) => patch("busAccess", v)}
            />
            <EditableField
              label="Distance to transit (mi)"
              type="number"
              value={house.distanceToTransit}
              min={0}
              onChange={(v) => patch("distanceToTransit", Number(v))}
            />
            <EditableField
              label="Distance to downtown (mi)"
              type="number"
              value={house.distanceToDowntown}
              min={0}
              onChange={(v) => patch("distanceToDowntown", Number(v))}
            />
            <Field label="Coordinates">
              {house.lat.toFixed(4)}, {house.lon.toFixed(4)}
            </Field>
          </div>
        </section>
      </div>
    </div>
  );
}

export default function HousePage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-slate-400">Loading…</div>}>
      <HousePageContent />
    </Suspense>
  );
}
