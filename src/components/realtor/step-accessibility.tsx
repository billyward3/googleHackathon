interface StepAccessibilityProps {
  wheelchairAccess: boolean;
  elderlyFriendly: boolean;
  noStairs: boolean;
  additionalNeeds: string;
  onChange: (
    field: "wheelchairAccess" | "elderlyFriendly" | "noStairs" | "additionalNeeds",
    value: boolean | string,
  ) => void;
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-xl p-5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2"
      style={{
        border: checked ? "2px solid #5ba89d" : "1px solid var(--line)",
        background: checked ? "rgba(91, 168, 157, 0.08)" : "transparent",
      }}
    >
      <div>
        <div className="text-lg font-medium" style={{ color: "var(--ink-1)" }}>
          {label}
        </div>
        <div className="mt-1 text-sm" style={{ color: "var(--ink-2)" }}>
          {description}
        </div>
      </div>
      <div
        className="flex h-8 w-14 flex-shrink-0 items-center rounded-full px-1 transition-colors"
        style={{ background: checked ? "#5ba89d" : "var(--line)" }}
      >
        <div
          className="h-6 w-6 rounded-full bg-white shadow transition-transform"
          style={{ transform: checked ? "translateX(24px)" : "translateX(0)" }}
        />
      </div>
    </button>
  );
}

export function StepAccessibility({
  wheelchairAccess,
  elderlyFriendly,
  noStairs,
  additionalNeeds,
  onChange,
}: StepAccessibilityProps) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2
          className="display-font text-2xl font-semibold md:text-3xl"
          style={{ color: "var(--ink-1)" }}
        >
          Accessibility needs
        </h2>
        <p className="mt-2 text-lg" style={{ color: "var(--ink-2)" }}>
          We want to make sure your home works for everyone who lives there.
        </p>
      </div>

      <div className="flex flex-col gap-4">
        <Toggle
          label="Wheelchair accessible"
          description="Wide doorways, ramps, accessible bathroom"
          checked={wheelchairAccess}
          onChange={(v) => onChange("wheelchairAccess", v)}
        />
        <Toggle
          label="Senior-friendly layout"
          description="Single floor, grab bars, easy-to-reach fixtures"
          checked={elderlyFriendly}
          onChange={(v) => onChange("elderlyFriendly", v)}
        />
        <Toggle
          label="No stairs"
          description="Ground floor or elevator access only"
          checked={noStairs}
          onChange={(v) => onChange("noStairs", v)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="additional-needs"
          className="text-lg font-medium"
          style={{ color: "var(--ink-1)" }}
        >
          Any other accommodations?
        </label>
        <p className="text-sm" style={{ color: "var(--ink-2)" }}>
          Tell us about anything else that would help you feel safe and comfortable at home.
        </p>
        <textarea
          id="additional-needs"
          value={additionalNeeds}
          onChange={(e) => onChange("additionalNeeds", e.target.value)}
          placeholder="e.g., need to be near a hospital, service animal, hearing impaired..."
          rows={3}
          className="w-full rounded-xl p-4 text-base transition-colors focus-visible:outline-none focus-visible:ring-2"
          style={{
            border: "1px solid var(--line)",
            color: "var(--ink-1)",
            background: "rgba(255, 255, 255, 0.6)",
            resize: "vertical",
          }}
        />
      </div>
    </div>
  );
}
