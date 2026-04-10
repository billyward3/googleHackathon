import { ImportanceLevel } from "@/lib/realtor/types";

const IMPORTANCE_LABELS: Record<ImportanceLevel, string> = {
  0: "Not important",
  1: "Nice to have",
  2: "Important",
  3: "Must have",
};

interface StepSummaryProps {
  householdSize: number;
  desiredBedrooms: number;
  hasPets: boolean;
  wheelchairAccess: boolean;
  elderlyFriendly: boolean;
  noStairs: boolean;
  additionalNeeds: string;
  transitImportance: ImportanceLevel;
  parkingNeeded: boolean;
  onJumpToStep: (step: number) => void;
}

function SummarySection({
  title,
  stepIndex,
  onEdit,
  children,
}: {
  title: string;
  stepIndex: number;
  onEdit: (step: number) => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-xl p-5"
      style={{ border: "1px solid var(--line)", background: "rgba(255, 255, 255, 0.5)" }}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--ink-2)" }}>
          {title}
        </h3>
        <button
          onClick={() => onEdit(stepIndex)}
          className="rounded-lg px-3 py-1 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2"
          style={{ color: "#5ba89d" }}
        >
          Edit
        </button>
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span style={{ color: "var(--ink-2)" }}>{label}</span>
      <span className="text-right font-medium" style={{ color: "var(--ink-1)" }}>
        {value}
      </span>
    </div>
  );
}

export function StepSummary({
  householdSize,
  desiredBedrooms,
  hasPets,
  wheelchairAccess,
  elderlyFriendly,
  noStairs,
  additionalNeeds,
  transitImportance,
  parkingNeeded,
  onJumpToStep,
}: StepSummaryProps) {
  const accessibilityItems = [
    wheelchairAccess && "Wheelchair accessible",
    elderlyFriendly && "Senior-friendly",
    noStairs && "No stairs",
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2
          className="display-font text-2xl font-semibold md:text-3xl"
          style={{ color: "var(--ink-1)" }}
        >
          Review your needs
        </h2>
        <p className="mt-2 text-lg" style={{ color: "var(--ink-2)" }}>
          Make sure everything looks right, then find your matches.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <SummarySection title="Household" stepIndex={0} onEdit={onJumpToStep}>
          <Row label="People" value={String(householdSize)} />
          <Row label="Bedrooms" value={String(desiredBedrooms)} />
          <Row label="Pets" value={hasPets ? "Yes" : "No"} />
        </SummarySection>

        <SummarySection title="Accessibility" stepIndex={1} onEdit={onJumpToStep}>
          <Row
            label="Needs"
            value={accessibilityItems.length > 0 ? accessibilityItems.join(", ") : "None specified"}
          />
          {additionalNeeds && (
            <Row label="Other" value={additionalNeeds} />
          )}
        </SummarySection>

        <SummarySection title="Location" stepIndex={2} onEdit={onJumpToStep}>
          <Row label="Public transit" value={IMPORTANCE_LABELS[transitImportance]} />
          <Row label="Parking" value={parkingNeeded ? "Needed" : "Not needed"} />
        </SummarySection>
      </div>

      <div className="flex flex-col gap-3 pt-2">
        <p className="text-center text-sm" style={{ color: "var(--ink-2)" }}>
          Need help? Talk to someone instead.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => {}}
            className="flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2"
            style={{
              border: "1px solid var(--line)",
              color: "var(--ink-1)",
              background: "rgba(255, 255, 255, 0.6)",
            }}
          >
            Talk to a virtual agent
          </button>
          <button
            onClick={() => {}}
            className="flex-1 rounded-xl px-4 py-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2"
            style={{
              border: "1px solid var(--line)",
              color: "var(--ink-1)",
              background: "rgba(255, 255, 255, 0.6)",
            }}
          >
            Call us
          </button>
        </div>
      </div>
    </div>
  );
}
