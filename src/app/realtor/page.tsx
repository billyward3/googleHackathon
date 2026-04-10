"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { WizardShell } from "@/components/realtor/wizard-shell";
import { StepHousehold } from "@/components/realtor/step-household";
import { StepAccessibility } from "@/components/realtor/step-accessibility";
import { StepLocation } from "@/components/realtor/step-location";
import { StepSummary } from "@/components/realtor/step-summary";
import { ResultsPanel } from "@/components/realtor/results-panel";
import { fetchListings } from "@/lib/realtor/api-client";
import { rankListings } from "@/lib/realtor/scoring";
import {
  ImportanceLevel,
  ScoredListing,
  TenantProfile,
} from "@/lib/realtor/types";

const TOTAL_STEPS = 4;

interface WizardState {
  householdSize: number;
  desiredBedrooms: number;
  hasPets: boolean;
  wheelchairAccess: boolean;
  elderlyFriendly: boolean;
  noStairs: boolean;
  additionalNeeds: string;
  transitImportance: ImportanceLevel;
  parkingNeeded: boolean;
}

const INITIAL_STATE: WizardState = {
  householdSize: 2,
  desiredBedrooms: 2,
  hasPets: false,
  wheelchairAccess: false,
  elderlyFriendly: false,
  noStairs: false,
  additionalNeeds: "",
  transitImportance: 1,
  parkingNeeded: false,
};

function buildProfile(state: WizardState): TenantProfile {
  return {
    householdSize: state.householdSize,
    desiredBedrooms: state.desiredBedrooms,
    hasPets: state.hasPets,
    accessibility: {
      wheelchairAccess: state.wheelchairAccess,
      elderlyFriendly: state.elderlyFriendly,
      noStairs: state.noStairs,
      additionalNeeds: state.additionalNeeds,
    },
    location: {
      transitImportance: state.transitImportance,
      parkingNeeded: state.parkingNeeded,
    },
  };
}

export default function RealtorPage() {
  const [step, setStep] = useState(-1);
  const [state, setState] = useState<WizardState>({ ...INITIAL_STATE });
  const [results, setResults] = useState<ScoredListing[] | null>(null);
  const [loading, setLoading] = useState(false);

  function patch<K extends keyof WizardState>(field: K, value: WizardState[K]) {
    setState((prev) => ({ ...prev, [field]: value }));
  }

  async function handleFinish() {
    setLoading(true);
    try {
      const profile = buildProfile(state);
      const listings = await fetchListings();
      const ranked = rankListings(profile, listings);
      setResults(ranked);
    } catch (err) {
      console.error("Failed to fetch listings:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function handleStartOver() {
    setStep(-1);
    setState({ ...INITIAL_STATE });
    setResults(null);
    setLoading(false);
  }

  function handleNext() {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  }

  function handleBack() {
    if (step > 0) {
      setStep(step - 1);
    }
  }

  function jumpToStep(target: number) {
    setStep(target);
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-8">
        <motion.div
          className="flex flex-col items-center gap-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div
            className="h-12 w-12 animate-spin rounded-full border-4 border-t-transparent"
            style={{ borderColor: "var(--line)", borderTopColor: "#5ba89d" }}
          />
          <p className="text-lg" style={{ color: "var(--ink-2)" }}>
            Finding your best matches...
          </p>
        </motion.div>
      </main>
    );
  }

  if (results !== null) {
    return (
      <main className="min-h-screen px-4 py-8">
        <ResultsPanel results={results} profile={buildProfile(state)} onStartOver={handleStartOver} />
      </main>
    );
  }

  if (step < 0) {
    return (
      <main className="flex min-h-screen items-center justify-center px-4 py-8">
        <motion.div
          className="mx-auto flex max-w-xl flex-col items-center gap-8 text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1
            className="display-font text-4xl font-semibold md:text-5xl"
            style={{ color: "var(--ink-1)" }}
          >
            Find your next home
          </h1>
          <p className="text-xl leading-relaxed" style={{ color: "var(--ink-2)" }}>
            We&apos;ll ask a few simple questions about what you need, then show you
            the best available homes in Detroit — ranked just for you.
          </p>
          <p className="text-lg" style={{ color: "var(--ink-2)" }}>
            It only takes a minute.
          </p>
          <button
            onClick={() => setStep(0)}
            className="rounded-xl px-10 py-5 text-xl font-semibold text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
            style={{
              background: "linear-gradient(135deg, #5ba89d, #4a8f86)",
              minHeight: "64px",
            }}
          >
            Get started
          </button>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-4 py-8">
      <WizardShell
        currentStep={step}
        totalSteps={TOTAL_STEPS}
        onBack={handleBack}
        onNext={handleNext}
        canGoNext={true}
        nextLabel={step === TOTAL_STEPS - 1 ? "Find my matches" : undefined}
      >
        {step === 0 && (
          <StepHousehold
            householdSize={state.householdSize}
            desiredBedrooms={state.desiredBedrooms}
            hasPets={state.hasPets}
            onChange={(field, value) => {
              if (field === "householdSize") patch("householdSize", value as number);
              if (field === "desiredBedrooms") patch("desiredBedrooms", value as number);
              if (field === "hasPets") patch("hasPets", value as boolean);
            }}
          />
        )}
        {step === 1 && (
          <StepAccessibility
            wheelchairAccess={state.wheelchairAccess}
            elderlyFriendly={state.elderlyFriendly}
            noStairs={state.noStairs}
            additionalNeeds={state.additionalNeeds}
            onChange={(field, value) => {
              if (field === "wheelchairAccess") patch("wheelchairAccess", value as boolean);
              if (field === "elderlyFriendly") patch("elderlyFriendly", value as boolean);
              if (field === "noStairs") patch("noStairs", value as boolean);
              if (field === "additionalNeeds") patch("additionalNeeds", value as string);
            }}
          />
        )}
        {step === 2 && (
          <StepLocation
            transitImportance={state.transitImportance}
            parkingNeeded={state.parkingNeeded}
            onChange={(field, value) => {
              if (field === "transitImportance") patch("transitImportance", value as ImportanceLevel);
              if (field === "parkingNeeded") patch("parkingNeeded", value as boolean);
            }}
          />
        )}
        {step === 3 && (
          <StepSummary
            householdSize={state.householdSize}
            desiredBedrooms={state.desiredBedrooms}
            hasPets={state.hasPets}
            wheelchairAccess={state.wheelchairAccess}
            elderlyFriendly={state.elderlyFriendly}
            noStairs={state.noStairs}
            additionalNeeds={state.additionalNeeds}
            transitImportance={state.transitImportance}
            parkingNeeded={state.parkingNeeded}
            onJumpToStep={jumpToStep}
          />
        )}
      </WizardShell>
    </main>
  );
}
