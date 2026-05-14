import type {
  DeficiencyProfile,
  Diet,
  Dose,
  Drug,
  Duration,
  IntakeData,
  NutrientKey,
  RiskTier,
  Symptom,
} from "@/types";

/**
 * Replete Deficiency Engine
 *
 * Core IP. Maps a 5-question intake to per-nutrient risk scores (0-95) and
 * an overall risk tier. Algorithm constants come straight from CLAUDE.md.
 * Do not loosen typing or short-circuit branches without updating the tests.
 */

const NUTRIENTS: NutrientKey[] = [
  "protein",
  "b12",
  "iron",
  "magnesium",
  "zinc",
  "vitaminD",
  "choline",
  "potassium",
];

const BASE: Record<NutrientKey, number> = {
  protein: 40,
  b12: 25,
  iron: 20,
  magnesium: 35,
  zinc: 20,
  vitaminD: 30,
  choline: 25,
  potassium: 20,
};

const DURATION_BOOST: Record<Duration, number> = {
  "0-3": 0,
  "3-6": 22,
  "6-12": 38,
  "12+": 52,
};

const DOSE_BOOST: Record<Dose, number> = {
  starter: 0,
  moderate: 18,
  high: 30,
};

/** Diet-driven additions on top of duration + dose. */
const DIET_MOD: Record<Diet, Partial<Record<NutrientKey, number>>> = {
  omni: {},
  veg: { b12: 28, iron: 22, zinc: 18, choline: 20 },
  vegan: { b12: 40, iron: 30, zinc: 25, choline: 30, vitaminD: 15 },
  keto: { magnesium: 20, potassium: 25, vitaminD: 10 },
};

/** Drug-specific additions. Tirzepatide is a dual agonist → stronger appetite suppression. */
const DRUG_MOD: Record<Drug, Partial<Record<NutrientKey, number>>> = {
  sema: {},
  tirz: { protein: 10, magnesium: 8 },
  other: {},
};

/** Symptom signal mapping — direct diagnostic signals from the user. */
const SYMPTOM_MOD: Record<Symptom, Partial<Record<NutrientKey, number>>> = {
  fatigue: { iron: 20, b12: 15, vitaminD: 12 },
  hairloss: { zinc: 25, iron: 15, protein: 20 },
  muscle: { protein: 30, magnesium: 15 },
  brainfog: { choline: 25, b12: 18 },
  nausea: { potassium: 18, magnesium: 12 },
  none: {},
};

const MAX_SCORE = 95;

function clamp(value: number): number {
  if (value < 0) return 0;
  if (value > MAX_SCORE) return MAX_SCORE;
  return value;
}

export function calculateDeficiencies(intake: IntakeData): DeficiencyProfile {
  const scores: Record<NutrientKey, number> = { ...BASE };

  const durationBoost = DURATION_BOOST[intake.duration];
  const doseBoost = DOSE_BOOST[intake.dose];
  for (const key of NUTRIENTS) {
    scores[key] += durationBoost + doseBoost;
  }

  for (const [k, v] of Object.entries(DIET_MOD[intake.diet])) {
    scores[k as NutrientKey] += v ?? 0;
  }

  for (const [k, v] of Object.entries(DRUG_MOD[intake.drug])) {
    scores[k as NutrientKey] += v ?? 0;
  }

  for (const symptom of intake.symptoms) {
    for (const [k, v] of Object.entries(SYMPTOM_MOD[symptom])) {
      scores[k as NutrientKey] += v ?? 0;
    }
  }

  for (const key of NUTRIENTS) {
    scores[key] = clamp(scores[key]);
  }

  const overallScore = Math.round(
    NUTRIENTS.reduce((sum, k) => sum + scores[k], 0) / NUTRIENTS.length,
  );

  const riskTier = getRiskLabel(overallScore).tier;

  return {
    protein: scores.protein,
    b12: scores.b12,
    iron: scores.iron,
    magnesium: scores.magnesium,
    zinc: scores.zinc,
    vitaminD: scores.vitaminD,
    choline: scores.choline,
    potassium: scores.potassium,
    overallScore,
    riskTier,
  };
}

export function getRiskLabel(score: number): {
  label: string;
  tier: RiskTier;
} {
  if (score >= 65) return { label: "High Risk", tier: "high" };
  if (score >= 40) return { label: "Moderate", tier: "moderate" };
  return { label: "Low", tier: "low" };
}

export const NUTRIENT_LABELS: Record<NutrientKey, string> = {
  protein: "Protein",
  b12: "Vitamin B12",
  iron: "Iron",
  magnesium: "Magnesium",
  zinc: "Zinc",
  vitaminD: "Vitamin D",
  choline: "Choline",
  potassium: "Potassium",
};

export const NUTRIENT_KEYS = NUTRIENTS;
