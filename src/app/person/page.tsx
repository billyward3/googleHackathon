"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { createSeedState } from "@/data/seedScenario";
import { Household, HousingUnit } from "@/types/housing";
import { getUnitById } from "@/lib/eligibility";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">{label}</div>
      <div className="text-sm text-slate-900">{children}</div>
    </div>
  );
}

let _seedState: ReturnType<typeof createSeedState> | null = null;
function getSeedState() {
  if (!_seedState) _seedState = createSeedState();
  return _seedState;
}

function PreferencesEditor({
  preferences,
  units,
  onChange,
}: {
  preferences: string[];
  units: HousingUnit[];
  onChange: (prefs: string[]) => void;
}) {
  const [addValue, setAddValue] = useState("");

  const unlistedUnits = units.filter((u) => !preferences.includes(u.id));

  function moveUp(i: number) {
    if (i === 0) return;
    const next = [...preferences];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    onChange(next);
  }

  function moveDown(i: number) {
    if (i === preferences.length - 1) return;
    const next = [...preferences];
    [next[i], next[i + 1]] = [next[i + 1], next[i]];
    onChange(next);
  }

  function remove(i: number) {
    const next = [...preferences];
    next.splice(i, 1);
    onChange(next);
  }

  function add() {
    if (!addValue || preferences.includes(addValue)) return;
    onChange([...preferences, addValue]);
    setAddValue("");
  }

  return (
    <div>
      <div className="space-y-1.5">
        {preferences.map((unitId, i) => {
          const unit = getUnitById(units, unitId);
          return (
            <div
              key={unitId}
              className="flex items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
            >
              <span className="w-6 shrink-0 text-center text-xs font-semibold text-slate-400">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-slate-800">
                  {unit?.siteName ?? unitId}
                </div>
                <div className="text-xs text-slate-400">{unit?.neighborhood}</div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => moveUp(i)}
                  disabled={i === 0}
                  className="rounded-lg px-1.5 py-1 text-xs text-slate-400 hover:bg-white hover:text-slate-700 disabled:opacity-30"
                  title="Move up"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveDown(i)}
                  disabled={i === preferences.length - 1}
                  className="rounded-lg px-1.5 py-1 text-xs text-slate-400 hover:bg-white hover:text-slate-700 disabled:opacity-30"
                  title="Move down"
                >
                  ↓
                </button>
                <button
                  onClick={() => remove(i)}
                  className="rounded-lg px-1.5 py-1 text-xs text-red-400 hover:bg-red-50 hover:text-red-600"
                  title="Remove (mark unacceptable)"
                >
                  ×
                </button>
              </div>
            </div>
          );
        })}

        {preferences.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center text-sm text-slate-400">
            No acceptable units — all units are unacceptable.
          </div>
        )}
      </div>

      {/* Add unit */}
      {unlistedUnits.length > 0 && (
        <div className="mt-3 flex gap-2">
          <select
            value={addValue}
            onChange={(e) => setAddValue(e.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-slate-400"
          >
            <option value="">Add acceptable unit…</option>
            {unlistedUnits.map((u) => (
              <option key={u.id} value={u.id}>
                {u.siteName} · {u.neighborhood}
              </option>
            ))}
          </select>
          <button
            onClick={add}
            disabled={!addValue}
            className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            Add
          </button>
        </div>
      )}

      <p className="mt-2 text-[11px] text-slate-400">
        Units not listed above are treated as unacceptable.
      </p>
    </div>
  );
}

function PersonPageContent() {
  const params = useSearchParams();
  const router = useRouter();
  const id = params.get("id") ?? "";

  const [household, setHousehold] = useState<Household | null>(null);
  const [units, setUnits] = useState<HousingUnit[]>([]);
  const [preferences, setPreferences] = useState<string[]>([]);
  const [optedIn, setOptedIn] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const state = getSeedState();
    setUnits(state.units);
    const found = state.households.find((h) => h.id === id) ?? null;
    setHousehold(found);
    if (found) {
      const storedPrefs = typeof window !== "undefined"
        ? localStorage.getItem(`person:${id}:prefs`)
        : null;
      setPreferences(storedPrefs ? JSON.parse(storedPrefs) : found.preferences);

      // Opt-in preference: localStorage overrides the seed default (true)
      const storedOptIn = typeof window !== "undefined"
        ? localStorage.getItem(`ttc:optedIn:${id}`)
        : null;
      setOptedIn(storedOptIn !== null ? storedOptIn === "true" : found.optedIn);
    }
  }, [id]);

  if (!household) {
    return (
      <div className="flex h-screen items-center justify-center text-slate-400">
        Person not found.
      </div>
    );
  }

  const currentUnit = household.currentUnitId ? getUnitById(units, household.currentUnitId) : null;
  const isQueueHousehold = household.source === "fifo_queue";

  function savePreferences() {
    localStorage.setItem(`person:${id}:prefs`, JSON.stringify(preferences));
    setSaved(true);
  }

  function toggleOptIn() {
    const next = !optedIn;
    setOptedIn(next);
    localStorage.setItem(`ttc:optedIn:${id}`, String(next));
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-2xl">
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
              {household.source === "original" ? "Seed resident" : "Queue household"}
            </div>
            <h1 className="text-3xl font-bold text-slate-900">{household.name}</h1>
            <div className="mt-1 text-sm text-slate-500">
              {currentUnit
                ? `Currently in ${currentUnit.siteName}`
                : isQueueHousehold
                  ? "Waiting in FIFO queue"
                  : "Moved out"}
            </div>
          </div>
          <div
            className={`mt-6 flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium uppercase tracking-[0.18em] ${
              optedIn ? "bg-emerald-50 text-emerald-700" : "bg-stone-100 text-stone-500"
            }`}
          >
            <span>{optedIn ? "✓" : "○"}</span>
            <span>{optedIn ? "TTC in" : "TTC out"}</span>
          </div>
        </div>

        {/* Household details */}
        <section className="mb-4 rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
            Household
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Field label="ID">{household.id}</Field>
            <Field label="Household size">{household.householdSize}</Field>
            <Field label="Wait time">{household.waitTimeMonths} months</Field>
            <Field label="Priority group">{household.priorityGroup}</Field>
            <Field label="Accessibility need">{household.accessibilityNeed ? "Yes" : "No"}</Field>
          </div>
        </section>

        {/* TTC opt-in toggle — queue households only */}
        {isQueueHousehold && (
          <section className="mb-4 rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  TTC participation
                </div>
                <div className="mt-1 text-sm text-slate-600">
                  {optedIn
                    ? "This household will participate in top-trading-cycles reallocation."
                    : "This household has opted out and will keep their FIFO assignment."}
                </div>
                <div className="mt-1 text-[11px] text-slate-400">
                  Changes take effect when FIFO runs (or in real-time via the map toggle after FIFO).
                </div>
              </div>
              <button
                onClick={toggleOptIn}
                className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                  optedIn
                    ? "bg-emerald-500 text-white hover:bg-emerald-600"
                    : "bg-stone-200 text-stone-600 hover:bg-stone-300"
                }`}
              >
                {optedIn ? "Opted in ✓" : "Opted out ○"}
              </button>
            </div>
          </section>
        )}

        {/* Current housing */}
        {currentUnit && (
          <section className="mb-4 rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Current unit
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <Field label="Site name">{currentUnit.siteName}</Field>
              <Field label="Address">{currentUnit.address}</Field>
              <Field label="Neighborhood">{currentUnit.neighborhood}</Field>
              <Field label="Bedrooms">{currentUnit.bedrooms}</Field>
              <Field label="Wheelchair access">{currentUnit.wheelchairAccess ? "Yes" : "No"}</Field>
              <Field label="Rent">${currentUnit.monthlyRent}/mo</Field>
            </div>
            <button
              onClick={() => router.push(`/house?id=${currentUnit.siteId}`)}
              className="mt-4 rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-600 hover:bg-white"
            >
              View full unit details →
            </button>
          </section>
        )}

        {/* Ranked preferences — editable for queue households */}
        {isQueueHousehold && (
          <section className="mb-4 rounded-2xl bg-white p-5 shadow-sm">
            <div className="mb-1 flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Ranked preferences
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">{preferences.length} acceptable</span>
                <button
                  onClick={savePreferences}
                  className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.18em] text-white hover:bg-slate-700"
                >
                  {saved ? "Saved ✓" : "Save"}
                </button>
              </div>
            </div>
            <p className="mb-3 text-xs text-slate-400">
              Drag the rank order. Remove units to mark them unacceptable.
            </p>
            <PreferencesEditor
              preferences={preferences}
              units={units}
              onChange={(p) => { setPreferences(p); setSaved(false); }}
            />
          </section>
        )}
      </div>
    </div>
  );
}

export default function PersonPage() {
  return (
    <Suspense fallback={<div className="flex h-screen items-center justify-center text-slate-400">Loading…</div>}>
      <PersonPageContent />
    </Suspense>
  );
}
