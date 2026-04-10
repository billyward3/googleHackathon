import { ImportanceLevel } from "@/lib/realtor/types";

interface StepLocationProps {
  transitImportance: ImportanceLevel;
  parkingNeeded: boolean;
  onChange: (
    field: "transitImportance" | "parkingNeeded",
    value: ImportanceLevel | boolean,
  ) => void;
}

const IMPORTANCE_LABELS: { value: ImportanceLevel; label: string }[] = [
  { value: 0, label: "Not important" },
  { value: 1, label: "Nice to have" },
  { value: 2, label: "Important" },
  { value: 3, label: "Must have" },
];

export function StepLocation({
  transitImportance,
  parkingNeeded,
  onChange,
}: StepLocationProps) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2
          className="display-font text-2xl font-semibold md:text-3xl"
          style={{ color: "var(--ink-1)" }}
        >
          Location needs
        </h2>
        <p className="mt-2 text-lg" style={{ color: "var(--ink-2)" }}>
          Help us understand how you get around.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        <div>
          <div className="text-lg font-medium" style={{ color: "var(--ink-1)" }}>
            How important is public transit?
          </div>
          <div className="text-sm" style={{ color: "var(--ink-2)" }}>
            Bus stops and transit stations nearby
          </div>
        </div>
        <div className="flex gap-2" role="radiogroup" aria-label="Public transit importance">
          {IMPORTANCE_LABELS.map((option) => (
            <button
              key={option.value}
              role="radio"
              aria-checked={transitImportance === option.value}
              onClick={() => onChange("transitImportance", option.value)}
              className="flex-1 rounded-lg px-2 py-3 text-center text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2"
              style={{
                border:
                  transitImportance === option.value
                    ? "2px solid #5ba89d"
                    : "1px solid var(--line)",
                background:
                  transitImportance === option.value
                    ? "rgba(91, 168, 157, 0.08)"
                    : "transparent",
                color: transitImportance === option.value ? "#3d7a71" : "var(--ink-2)",
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <button
        role="switch"
        aria-checked={parkingNeeded}
        onClick={() => onChange("parkingNeeded", !parkingNeeded)}
        className="flex w-full items-center justify-between gap-4 rounded-xl p-5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2"
        style={{
          border: parkingNeeded ? "2px solid #5ba89d" : "1px solid var(--line)",
          background: parkingNeeded ? "rgba(91, 168, 157, 0.08)" : "transparent",
        }}
      >
        <div>
          <div className="text-lg font-medium" style={{ color: "var(--ink-1)" }}>
            Do you need parking?
          </div>
          <div className="mt-1 text-sm" style={{ color: "var(--ink-2)" }}>
            You have a car and need a parking spot
          </div>
        </div>
        <div
          className="flex h-8 w-14 flex-shrink-0 items-center rounded-full px-1 transition-colors"
          style={{ background: parkingNeeded ? "#5ba89d" : "var(--line)" }}
        >
          <div
            className="h-6 w-6 rounded-full bg-white shadow transition-transform"
            style={{ transform: parkingNeeded ? "translateX(24px)" : "translateX(0)" }}
          />
        </div>
      </button>
    </div>
  );
}
