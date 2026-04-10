"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ReactNode } from "react";

const STEP_LABELS = [
  "Household",
  "Accessibility",
  "Location",
  "Review",
];

interface WizardShellProps {
  currentStep: number;
  totalSteps: number;
  children: ReactNode;
  onBack: () => void;
  onNext: () => void;
  canGoNext: boolean;
  nextLabel?: string;
}

export function WizardShell({
  currentStep,
  totalSteps,
  children,
  onBack,
  onNext,
  canGoNext,
  nextLabel,
}: WizardShellProps) {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-2xl flex-col gap-6">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm" style={{ color: "var(--ink-2)" }}>
          <span>
            Step {currentStep + 1} of {totalSteps}
          </span>
          <span>{STEP_LABELS[currentStep] ?? ""}</span>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full"
          style={{ background: "var(--line)" }}
          role="progressbar"
          aria-valuenow={currentStep + 1}
          aria-valuemin={1}
          aria-valuemax={totalSteps}
          aria-label={`Step ${currentStep + 1} of ${totalSteps}: ${STEP_LABELS[currentStep] ?? ""}`}
        >
          <motion.div
            className="h-full rounded-full"
            style={{ background: "linear-gradient(90deg, #5ba89d, #7cc8c2)" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
      </div>

      <div className="panel-surface flex-1 rounded-2xl p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between gap-4">
        {currentStep > 0 ? (
          <button
            onClick={onBack}
            className="rounded-xl px-8 py-4 text-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              color: "var(--ink-2)",
              border: "1px solid var(--line)",
              minWidth: "120px",
              minHeight: "56px",
            }}
          >
            Back
          </button>
        ) : (
          <div />
        )}
        <button
          onClick={onNext}
          disabled={!canGoNext}
          className="rounded-xl px-8 py-4 text-lg font-semibold text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-40"
          style={{
            background: canGoNext
              ? "linear-gradient(135deg, #5ba89d, #4a8f86)"
              : "var(--ink-2)",
            minWidth: "160px",
            minHeight: "56px",
          }}
        >
          {nextLabel ?? "Next"}
        </button>
      </div>
    </div>
  );
}
