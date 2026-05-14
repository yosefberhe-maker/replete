"use client";

import { useReducer } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { STEPS } from "@/lib/intake-steps";
import { calculateDeficiencies } from "@/lib/deficiency-engine";
import { getSupplementRecommendations } from "@/lib/supplement-data";
import { getMealPlan } from "@/lib/meal-data";
import type {
  CompleteProfile,
  Diet,
  Dose,
  Drug,
  Duration,
  IntakeData,
  Symptom,
} from "@/types";

const STORAGE_KEY = "replete_profile";

type Answers = Partial<IntakeData>;

type WizardState = {
  currentStep: number;
  answers: Answers;
  direction: 1 | -1;
  isComplete: boolean;
};

type WizardAction =
  | { type: "set"; key: keyof IntakeData; value: unknown }
  | { type: "toggle-symptom"; value: Symptom }
  | { type: "next" }
  | { type: "back" }
  | { type: "complete" };

function reducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case "set":
      return {
        ...state,
        answers: { ...state.answers, [action.key]: action.value as never },
      };
    case "toggle-symptom": {
      const current = (state.answers.symptoms ?? []) as Symptom[];
      // "None" is mutually exclusive with everything else.
      if (action.value === "none") {
        return {
          ...state,
          answers: { ...state.answers, symptoms: ["none"] },
        };
      }
      const withoutNone = current.filter((s) => s !== "none");
      const next = withoutNone.includes(action.value)
        ? withoutNone.filter((s) => s !== action.value)
        : [...withoutNone, action.value];
      return { ...state, answers: { ...state.answers, symptoms: next } };
    }
    case "next":
      return {
        ...state,
        currentStep: Math.min(state.currentStep + 1, STEPS.length - 1),
        direction: 1,
      };
    case "back":
      return {
        ...state,
        currentStep: Math.max(state.currentStep - 1, 0),
        direction: -1,
      };
    case "complete":
      return { ...state, isComplete: true };
  }
}

function getStepValue(answers: Answers, key: keyof IntakeData): unknown {
  return answers[key];
}

function isStepValid(state: WizardState): boolean {
  const step = STEPS[state.currentStep];
  const value = getStepValue(state.answers, step.key);
  if (step.type === "multi") {
    return Array.isArray(value) && value.length > 0;
  }
  return typeof value === "string" && value.length > 0;
}

function persistAndAnalyze(answers: Answers): CompleteProfile {
  const intake = answers as IntakeData;
  const profile = calculateDeficiencies(intake);
  const supplements = getSupplementRecommendations(profile);
  const mealPlan = getMealPlan(intake, profile);
  const result: CompleteProfile = {
    intake,
    profile,
    supplements,
    mealPlan,
    generatedAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(result));
  }
  return result;
}

export default function IntakeWizard() {
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, {
    currentStep: 0,
    answers: {},
    direction: 1,
    isComplete: false,
  });

  const step = STEPS[state.currentStep];
  const isLast = state.currentStep === STEPS.length - 1;
  const valid = isStepValid(state);
  const progress = ((state.currentStep + 1) / STEPS.length) * 100;

  function handleSelect(value: string) {
    if (step.type === "multi") {
      dispatch({ type: "toggle-symptom", value: value as Symptom });
      return;
    }
    dispatch({ type: "set", key: step.key, value });
  }

  function handleContinue() {
    if (!valid) return;
    if (isLast) {
      dispatch({ type: "complete" });
      persistAndAnalyze(state.answers);
      router.push("/results");
      return;
    }
    dispatch({ type: "next" });
  }

  return (
    <div className="mx-auto w-full max-w-content px-4 pb-12 sm:px-6">
      <div className="mb-6">
        <div className="flex items-center justify-between text-xs font-medium text-sub">
          <button
            type="button"
            onClick={() => dispatch({ type: "back" })}
            disabled={state.currentStep === 0}
            className="inline-flex items-center gap-1 text-muted transition-colors hover:text-text disabled:invisible"
            aria-label="Back"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </button>
          <span>
            Step {state.currentStep + 1} of {STEPS.length}
          </span>
        </div>
        <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-card2">
          <motion.div
            className="h-full bg-green"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait" initial={false} custom={state.direction}>
        <motion.div
          key={step.key}
          custom={state.direction}
          initial={{ x: state.direction === 1 ? 40 : -40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: state.direction === 1 ? -40 : 40, opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <h1 className="text-2xl font-extrabold tracking-tight text-text sm:text-3xl">
            {step.title}
          </h1>
          <p className="mt-2 text-sm text-sub sm:text-base">{step.subtitle}</p>

          <ul className="mt-6 flex flex-col gap-3">
            {step.options.map((option) => {
              const selected =
                step.type === "multi"
                  ? Array.isArray(state.answers.symptoms) &&
                    (state.answers.symptoms as Symptom[]).includes(
                      option.value as Symptom,
                    )
                  : state.answers[step.key] === option.value;
              return (
                <li key={option.value}>
                  <OptionCard
                    title={option.title}
                    subtitle={option.subtitle}
                    badge={option.badge}
                    selected={selected}
                    multi={step.type === "multi"}
                    onClick={() => handleSelect(option.value)}
                  />
                </li>
              );
            })}
          </ul>
        </motion.div>
      </AnimatePresence>

      <div className="sticky bottom-4 mt-8">
        <button
          type="button"
          onClick={handleContinue}
          disabled={!valid}
          className={cn(
            "w-full rounded-xl px-5 py-4 text-base font-semibold transition-all",
            valid
              ? "bg-green text-bg shadow-lg shadow-green/20 hover:bg-emerald-400 active:scale-[0.99]"
              : "cursor-not-allowed bg-card2 text-muted",
          )}
        >
          {isLast ? "Get my plan" : "Continue"}
        </button>
      </div>
    </div>
  );
}

interface OptionCardProps {
  title: string;
  subtitle?: string;
  badge?: string;
  selected: boolean;
  multi: boolean;
  onClick: () => void;
}

function OptionCard({
  title,
  subtitle,
  badge,
  selected,
  multi,
  onClick,
}: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "group relative flex w-full items-start gap-3 rounded-xl border p-4 text-left transition-all min-h-[64px]",
        selected
          ? "border-green bg-green/10 ring-1 ring-green/40"
          : "border-border bg-card hover:border-card2 hover:bg-card2",
      )}
    >
      <div
        className={cn(
          "mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center transition-colors",
          multi ? "rounded-md border" : "rounded-full border",
          selected
            ? "border-green bg-green text-bg"
            : "border-border bg-transparent text-transparent",
        )}
        aria-hidden
      >
        {selected ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-text">{title}</span>
          {badge ? (
            <span className="rounded-full bg-card2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-sub">
              {badge}
            </span>
          ) : null}
        </div>
        {subtitle ? (
          <p className="mt-1 text-sm text-sub">{subtitle}</p>
        ) : null}
      </div>
    </button>
  );
}

export type { Drug, Duration, Dose, Diet, Symptom };
