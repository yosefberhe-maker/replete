"use client";

import { useReducer } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { STEPS, type StepConfig } from "@/lib/intake-steps";
import { calculateDeficiencies } from "@/lib/deficiency-engine";
import { getSupplementRecommendations } from "@/lib/supplement-data";
import { getMealPlan } from "@/lib/meal-data";
import { getCycleAdvice } from "@/lib/injection-cycle";
import { getGIProtocol } from "@/lib/gi-protocol";
import { getSafetyAlerts } from "@/lib/safety-alerts";
import type {
  CompleteProfile,
  DayOfWeek,
  Diet,
  Dose,
  Drug,
  Duration,
  InjectionTiming,
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

function isStepValid(step: StepConfig, answers: Answers): boolean {
  if (step.type === "multi") {
    const value = answers.symptoms;
    return Array.isArray(value) && value.length > 0;
  }
  if (step.type === "numeric") {
    const value = answers[step.key];
    return typeof value === "number" && value >= step.min && value <= step.max;
  }
  if (step.type === "compound") {
    return !!answers.injectionDay && !!answers.injectionTiming;
  }
  const value = answers[step.key];
  return typeof value === "string" && value.length > 0;
}

function persistAndAnalyze(answers: Answers): CompleteProfile {
  const intake = answers as IntakeData;
  const profile = calculateDeficiencies(intake);
  const supplements = getSupplementRecommendations(profile, intake);
  const mealPlan = getMealPlan(intake, profile);
  const cycle = getCycleAdvice(
    intake.injectionDay,
    intake.injectionTiming,
    profile,
  );
  const gi = getGIProtocol(intake.symptoms);
  const safetyAlerts = getSafetyAlerts(intake);
  const result: CompleteProfile = {
    intake,
    profile,
    supplements,
    mealPlan,
    cycle,
    gi,
    safetyAlerts,
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
  const valid = isStepValid(step, state.answers);
  const progress = ((state.currentStep + 1) / STEPS.length) * 100;

  function handleSelect(value: string) {
    if (step.type === "multi") {
      dispatch({ type: "toggle-symptom", value: value as Symptom });
      return;
    }
    if (step.type === "single") {
      dispatch({ type: "set", key: step.key, value });
    }
  }

  function handleNumeric(value: number) {
    if (step.type !== "numeric") return;
    dispatch({ type: "set", key: step.key, value });
  }

  function handleInjectionDay(value: DayOfWeek) {
    dispatch({ type: "set", key: "injectionDay", value });
  }

  function handleInjectionTiming(value: InjectionTiming) {
    dispatch({ type: "set", key: "injectionTiming", value });
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
          key={String(step.key)}
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

          <StepBody
            step={step}
            answers={state.answers}
            onSelect={handleSelect}
            onNumeric={handleNumeric}
            onInjectionDay={handleInjectionDay}
            onInjectionTiming={handleInjectionTiming}
          />
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

interface StepBodyProps {
  step: StepConfig;
  answers: Answers;
  onSelect: (value: string) => void;
  onNumeric: (value: number) => void;
  onInjectionDay: (value: DayOfWeek) => void;
  onInjectionTiming: (value: InjectionTiming) => void;
}

function StepBody({
  step,
  answers,
  onSelect,
  onNumeric,
  onInjectionDay,
  onInjectionTiming,
}: StepBodyProps) {
  if (step.type === "numeric") {
    const raw = answers[step.key];
    const value = typeof raw === "number" ? raw : "";
    return (
      <div className="mt-6">
        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted">
            Weight in lbs
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={step.min}
            max={step.max}
            placeholder={step.placeholder}
            value={value}
            onChange={(e) => {
              const n = e.target.value === "" ? Number.NaN : Number(e.target.value);
              if (Number.isFinite(n)) {
                onNumeric(n);
              }
            }}
            className="mt-2 w-full rounded-xl border border-border bg-card px-4 py-4 text-2xl font-semibold text-text placeholder:text-muted focus:border-green focus:outline-none"
            autoFocus
          />
        </label>
        <p className="mt-3 text-xs text-muted">
          Stored only in your browser. Not sent to any server unless you join the waitlist.
        </p>
      </div>
    );
  }

  if (step.type === "compound") {
    const selectedDay = answers.injectionDay;
    const selectedTiming = answers.injectionTiming;
    return (
      <div className="mt-6 flex flex-col gap-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            Day of week
          </p>
          <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-7">
            {step.days.map((d) => {
              const selected = selectedDay === d.value;
              return (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => onInjectionDay(d.value)}
                  aria-pressed={selected}
                  className={cn(
                    "rounded-lg border px-2 py-3 text-sm font-semibold transition-all",
                    selected
                      ? "border-green bg-green/10 text-text ring-1 ring-green/40"
                      : "border-border bg-card text-sub hover:border-card2 hover:text-text",
                  )}
                >
                  {d.title}
                </button>
              );
            })}
          </div>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            Time of day
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {step.timings.map((t) => {
              const selected = selectedTiming === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => onInjectionTiming(t.value)}
                  aria-pressed={selected}
                  className={cn(
                    "rounded-lg border px-2 py-3 text-sm font-semibold transition-all",
                    selected
                      ? "border-green bg-green/10 text-text ring-1 ring-green/40"
                      : "border-border bg-card text-sub hover:border-card2 hover:text-text",
                  )}
                >
                  {t.title}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // single + multi share the option-card pattern
  const options = step.options;
  return (
    <ul className="mt-6 flex flex-col gap-3">
      {options.map((option) => {
        const selected =
          step.type === "multi"
            ? Array.isArray(answers.symptoms) &&
              (answers.symptoms as Symptom[]).includes(option.value as Symptom)
            : answers[step.key] === option.value;
        return (
          <li key={option.value}>
            <OptionCard
              title={option.title}
              subtitle={option.subtitle}
              badge={option.badge}
              selected={selected}
              multi={step.type === "multi"}
              onClick={() => onSelect(option.value)}
            />
          </li>
        );
      })}
    </ul>
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
