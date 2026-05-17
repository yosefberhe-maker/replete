/**
 * POST /api/analyze
 *
 * Runs the full deficiency engine for a given IntakeData payload and
 * returns the complete profile (deficiency scores, supplements, meal plan,
 * injection-cycle advice, GI protocol, and safety alerts).
 */

import { NextResponse } from "next/server";
import { calculateDeficiencies } from "@/lib/deficiency-engine";
import { getSupplementRecommendations } from "@/lib/supplement-data";
import { getMealPlan } from "@/lib/meal-data";
import { getCycleAdvice } from "@/lib/injection-cycle";
import { getGIProtocol } from "@/lib/gi-protocol";
import { getSafetyAlerts } from "@/lib/safety-alerts";
import type {
  ActivityLevel,
  AgeRange,
  CompleteProfile,
  DayOfWeek,
  Diet,
  Dose,
  Drug,
  Duration,
  InjectionTiming,
  IntakeData,
  Sex,
  Symptom,
} from "@/types";

export const runtime = "nodejs";

const VALID_DRUGS: readonly Drug[] = ["sema", "tirz", "other"];
const VALID_DURATIONS: readonly Duration[] = ["0-3", "3-6", "6-12", "12+"];
const VALID_DOSES: readonly Dose[] = ["starter", "moderate", "high"];
const VALID_DIETS: readonly Diet[] = ["omni", "veg", "vegan", "keto"];
const VALID_SEXES: readonly Sex[] = ["male", "female"];
const VALID_AGES: readonly AgeRange[] = ["18-34", "35-49", "50-64", "65+"];
const VALID_ACTIVITY: readonly ActivityLevel[] = [
  "sedentary",
  "light",
  "moderate",
  "active",
];
const VALID_DAYS: readonly DayOfWeek[] = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
];
const VALID_TIMINGS: readonly InjectionTiming[] = ["morning", "evening"];
const VALID_SYMPTOMS: readonly Symptom[] = [
  "fatigue",
  "hairloss",
  "muscle",
  "brainfog",
  "nausea",
  "constipation",
  "none",
];

function parse(input: unknown): IntakeData | { error: string } {
  if (typeof input !== "object" || input === null) {
    return { error: "Expected JSON object" };
  }
  const d = input as Record<string, unknown>;
  if (!VALID_DRUGS.includes(d.drug as Drug)) return { error: "Invalid drug" };
  if (!VALID_DURATIONS.includes(d.duration as Duration))
    return { error: "Invalid duration" };
  if (!VALID_DOSES.includes(d.dose as Dose)) return { error: "Invalid dose" };
  if (!VALID_DIETS.includes(d.diet as Diet)) return { error: "Invalid diet" };
  if (!VALID_SEXES.includes(d.sex as Sex)) return { error: "Invalid sex" };
  if (!VALID_AGES.includes(d.ageRange as AgeRange))
    return { error: "Invalid ageRange" };
  if (!VALID_ACTIVITY.includes(d.activityLevel as ActivityLevel))
    return { error: "Invalid activityLevel" };
  if (!VALID_DAYS.includes(d.injectionDay as DayOfWeek))
    return { error: "Invalid injectionDay" };
  if (!VALID_TIMINGS.includes(d.injectionTiming as InjectionTiming))
    return { error: "Invalid injectionTiming" };
  if (
    typeof d.weightLbs !== "number" ||
    !Number.isFinite(d.weightLbs) ||
    d.weightLbs < 50 ||
    d.weightLbs > 800
  ) {
    return { error: "weightLbs must be a number between 50 and 800" };
  }
  if (!Array.isArray(d.symptoms)) return { error: "symptoms must be an array" };
  for (const s of d.symptoms as unknown[]) {
    if (!VALID_SYMPTOMS.includes(s as Symptom)) {
      return { error: `Invalid symptom: ${String(s)}` };
    }
  }
  return {
    drug: d.drug as Drug,
    duration: d.duration as Duration,
    dose: d.dose as Dose,
    diet: d.diet as Diet,
    sex: d.sex as Sex,
    ageRange: d.ageRange as AgeRange,
    activityLevel: d.activityLevel as ActivityLevel,
    injectionDay: d.injectionDay as DayOfWeek,
    injectionTiming: d.injectionTiming as InjectionTiming,
    weightLbs: d.weightLbs,
    symptoms: d.symptoms as Symptom[],
  };
}

export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 },
    );
  }
  const parsed = parse(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const profile = calculateDeficiencies(parsed);
  const supplements = getSupplementRecommendations(profile, parsed);
  const mealPlan = getMealPlan(parsed, profile);
  const cycle = getCycleAdvice(
    parsed.injectionDay,
    parsed.injectionTiming,
    profile,
  );
  const gi = getGIProtocol(parsed.symptoms);
  const safetyAlerts = getSafetyAlerts(parsed);

  const result: CompleteProfile = {
    intake: parsed,
    profile,
    supplements,
    mealPlan,
    cycle,
    gi,
    safetyAlerts,
    generatedAt: new Date().toISOString(),
  };

  return NextResponse.json(result);
}
