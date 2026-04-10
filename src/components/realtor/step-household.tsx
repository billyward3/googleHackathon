interface StepHouseholdProps {
  householdSize: number;
  desiredBedrooms: number;
  hasPets: boolean;
  onChange: (field: "householdSize" | "desiredBedrooms" | "hasPets", value: number | boolean) => void;
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <label className="text-lg font-medium" style={{ color: "var(--ink-1)" }}>
        {label}
      </label>
      <div className="flex items-center gap-4">
        <button
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="flex h-14 w-14 items-center justify-center rounded-xl text-2xl font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:opacity-30"
          style={{ border: "1px solid var(--line)", color: "var(--ink-1)" }}
          aria-label={`Decrease ${label}`}
        >
          -
        </button>
        <span
          className="min-w-[3rem] text-center text-3xl font-semibold"
          style={{ color: "var(--ink-1)" }}
          aria-live="polite"
        >
          {value}
        </span>
        <button
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="flex h-14 w-14 items-center justify-center rounded-xl text-2xl font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:opacity-30"
          style={{ border: "1px solid var(--line)", color: "var(--ink-1)" }}
          aria-label={`Increase ${label}`}
        >
          +
        </button>
      </div>
    </div>
  );
}

export function StepHousehold({
  householdSize,
  desiredBedrooms,
  hasPets,
  onChange,
}: StepHouseholdProps) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2
          className="display-font text-2xl font-semibold md:text-3xl"
          style={{ color: "var(--ink-1)" }}
        >
          Tell us about your household
        </h2>
        <p className="mt-2 text-lg" style={{ color: "var(--ink-2)" }}>
          This helps us find a home that fits your family.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <Stepper
          label="How many people will live here?"
          value={householdSize}
          min={1}
          max={10}
          onChange={(v) => onChange("householdSize", v)}
        />
        <Stepper
          label="How many bedrooms do you need?"
          value={desiredBedrooms}
          min={1}
          max={6}
          onChange={(v) => onChange("desiredBedrooms", v)}
        />

        <button
          role="switch"
          aria-checked={hasPets}
          onClick={() => onChange("hasPets", !hasPets)}
          className="flex w-full items-center justify-between gap-4 rounded-xl p-5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2"
          style={{
            border: hasPets ? "2px solid #5ba89d" : "1px solid var(--line)",
            background: hasPets ? "rgba(91, 168, 157, 0.08)" : "transparent",
          }}
        >
          <div>
            <div className="text-lg font-medium" style={{ color: "var(--ink-1)" }}>
              Do you have pets?
            </div>
            <div className="mt-1 text-sm" style={{ color: "var(--ink-2)" }}>
              We&apos;ll look for pet-friendly homes
            </div>
          </div>
          <div
            className="flex h-8 w-14 flex-shrink-0 items-center rounded-full px-1 transition-colors"
            style={{ background: hasPets ? "#5ba89d" : "var(--line)" }}
          >
            <div
              className="h-6 w-6 rounded-full bg-white shadow transition-transform"
              style={{ transform: hasPets ? "translateX(24px)" : "translateX(0)" }}
            />
          </div>
        </button>
      </div>
    </div>
  );
}
