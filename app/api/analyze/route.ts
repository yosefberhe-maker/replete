/**
 * POST /api/analyze
 *
 * Runs the full deficiency engine for a given IntakeData payload and
 * returns the complete profile. Intended for future mobile clients,
 * partner integrations, or server-side testing.
 */

import { NextResponse } from "next/server";
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

export const runtime = "nodejs";

const VALID_DRUGS: readonly Drug[] = ["sema", "tirz", "other"];
const VALID_DURATIONS: readonly Duration[] = ["0-3", "3-6", "6-12", "12+"];
const VALID_DOSES: readonly Dose[] = ["starter", "moderate", "high"];
const VALID_DIETS: readonly Diet[] = ["omni", "veg", "vegan", "keto"];
const VALID_SYMPTOMS: readonly Symptom[] = [
  "fatigue",
  "hairloss",
  "muscle",
  "brainfog",
  "nausea",
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
  const supplements = getSupplementRecommendations(profile);
  const mealPlan = getMealPlan(parsed, profile);

  const result: CompleteProfile = {
    intake: parsed,
    profile,
    supplements,
    mealPlan,
    generatedAt: new Date().toISOString(),
  };

  return NextResponse.json(result);
}
