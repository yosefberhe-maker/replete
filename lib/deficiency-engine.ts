import type {
  ActivityLevel,
  AgeRange,
  DeficiencyProfile,
  Diet,
  Dose,
  Drug,
  Duration,
  IntakeData,
  NutrientKey,
  RiskTier,
  Sex,
  Symptom,
} from "@/types";

/**
 * Replete Deficiency Engine
 *
 * Core IP. Maps intake to per-nutrient risk scores (0-95), an overall risk
 * tier, and quantitative daily targets. Algorithm constants and clinical
 * priors are calibrated against:
 *   - Butsch et al. 2025, Obesity Pillars, n=461,382 (DOI 10.1016/j.obpill.2025.100186)
 *   - Johnson et al. 2025, Obesity Pillars (PMID 41368199) — broad protein + MVI guidance only
 *   - Frontiers in Nutrition, March 2025, n=69 cross-sectional (DOI 10.3389/fnut.2025.1566498)
 *   - Melis et al. 2025, Diabetes Obesity Metab, n=51 — iron absorption mechanism
 *   - STEP 1 (PMC8089287) and SURMOUNT-1 (PMC11965027) — lean mass loss range
 *
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
  "fiber",
  "thiamine",
];

/**
 * Nutrients whose risk grows linearly with duration on GLP-1 and dose level.
 * Thiamine is intentionally excluded: it's an *acute* risk tied to vomiting,
 * not a slow-burn dietary gap.
 */
const NUTRIENTS_FOR_DOSE_PATTERN: NutrientKey[] = NUTRIENTS.filter(
  (k) => k !== "thiamine",
);

/**
 * Nutrients included in the overall risk score average. Thiamine is excluded
 * for the same reason — its score is binary-ish (0 unless GI symptoms) and
 * would skew the chronic-deficiency average downward for most users.
 */
const NUTRIENTS_FOR_OVERALL: NutrientKey[] = NUTRIENTS_FOR_DOSE_PATTERN;

const BASE: Record<NutrientKey, number> = {
  protein: 40,
  b12: 25,
  iron: 20,
  magnesium: 35,
  zinc: 20,
  vitaminD: 30,
  choline: 55,
  potassium: 20,
  fiber: 70,
  thiamine: 0,
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
  keto: { magnesium: 20, potassium: 25, vitaminD: 10, fiber: 15, choline: 10 },
};

/** Drug-specific additions. Tirzepatide is a dual agonist → stronger appetite suppression. */
const DRUG_MOD: Record<Drug, Partial<Record<NutrientKey, number>>> = {
  sema: {},
  tirz: { protein: 10, magnesium: 8 },
  other: {},
};

/**
 * Duration-specific nutrient boosts that go BEYOND the linear duration boost.
 * Reflects the clinical doubling of vitamin D deficiency at 12+ months
 * (Butsch et al. 2025, Obesity Pillars: 7.5% at 6 mo → 13.6% at 12 mo, n=461,382).
 */
const LONG_DURATION_NUTRIENT_BOOST: Partial<
  Record<Duration, Partial<Record<NutrientKey, number>>>
> = {
  "6-12": { vitaminD: 12 },
  "12+": { vitaminD: 25 },
};

/** Symptom signal mapping — direct diagnostic signals from the user. */
const SYMPTOM_MOD: Record<Symptom, Partial<Record<NutrientKey, number>>> = {
  fatigue: { iron: 20, b12: 15, vitaminD: 12 },
  hairloss: { zinc: 25, iron: 15, protein: 20 },
  muscle: { protein: 30, magnesium: 15 },
  brainfog: { choline: 25, b12: 18 },
  nausea: { potassium: 18, magnesium: 12 },
  vomiting: { potassium: 25, magnesium: 18, b12: 10 },
  constipation: { fiber: 20, magnesium: 10 },
  none: {},
};

/**
 * Thiamine floor by GI symptom. Nausea floors at 70 (high priority);
 * persistent vomiting floors at 95 (critical) because of the Wernicke's
 * encephalopathy case-report literature in GLP-1 users (Urbina et al. 2026).
 * Thiamine is *never* boosted by duration or dose alone — only by GI
 * symptoms — so users without those signals don't see the recommendation.
 */
const THIAMINE_FLOOR_NAUSEA = 70;
const THIAMINE_FLOOR_VOMITING = 95;

const MAX_SCORE = 95;

function clamp(value: number): number {
  if (value < 0) return 0;
  if (value > MAX_SCORE) return MAX_SCORE;
  return value;
}

/**
 * Pre-menopausal women have higher iron requirements and depletion risk
 * (menstrual losses, ~18 mg/day RDA vs 8 mg/day for males and post-menopausal women).
 * Reflected in the base score so iron consistently ranks higher for this cohort.
 */
function ironSexAgeBoost(sex: Sex, age: AgeRange): number {
  if (sex !== "female") return 0;
  if (age === "18-34" || age === "35-49") return 15;
  return 0;
}

/**
 * Protein target in grams, body-weight scaled per Johnson et al. 2025
 * (Obesity Pillars, PMID 41368199): 1.2–2.0 g/kg/day for GLP-1 users.
 *
 *   - 1.2 g/kg baseline (matches the floor of the recommended range)
 *   - 1.6 g/kg for active users (resistance training pushes upper-mid range)
 *   - 2.0 g/kg for long-duration high-dose users (most aggressive lean-mass
 *     defense window — high cumulative deficit, highest sarcopenia risk)
 */
export function calculateProteinTargetG(
  weightLbs: number,
  activity: ActivityLevel,
  duration: Duration,
  dose: Dose,
): number {
  const weightKg = weightLbs / 2.2046;
  const longDurationHighDose =
    (duration === "6-12" || duration === "12+") && dose === "high";
  let factor = 1.2;
  if (activity === "active") factor = 1.6;
  if (longDurationHighDose) factor = 2.0;
  return Math.round(weightKg * factor);
}

export function calculateDeficiencies(intake: IntakeData): DeficiencyProfile {
  const scores: Record<NutrientKey, number> = { ...BASE };

  const durationBoost = DURATION_BOOST[intake.duration];
  const doseBoost = DOSE_BOOST[intake.dose];
  for (const key of NUTRIENTS_FOR_DOSE_PATTERN) {
    scores[key] += durationBoost + doseBoost;
  }

  for (const [k, v] of Object.entries(DIET_MOD[intake.diet])) {
    scores[k as NutrientKey] += v ?? 0;
  }

  for (const [k, v] of Object.entries(DRUG_MOD[intake.drug])) {
    scores[k as NutrientKey] += v ?? 0;
  }

  const longDurationMod = LONG_DURATION_NUTRIENT_BOOST[intake.duration];
  if (longDurationMod) {
    for (const [k, v] of Object.entries(longDurationMod)) {
      scores[k as NutrientKey] += v ?? 0;
    }
  }

  for (const symptom of intake.symptoms) {
    for (const [k, v] of Object.entries(SYMPTOM_MOD[symptom])) {
      scores[k as NutrientKey] += v ?? 0;
    }
  }

  scores.iron += ironSexAgeBoost(intake.sex, intake.ageRange);

  // Thiamine — acute risk gated by GI symptoms. Floor-based, not additive.
  if (intake.symptoms.includes("vomiting")) {
    scores.thiamine = Math.max(scores.thiamine, THIAMINE_FLOOR_VOMITING);
  } else if (intake.symptoms.includes("nausea")) {
    scores.thiamine = Math.max(scores.thiamine, THIAMINE_FLOOR_NAUSEA);
  }

  for (const key of NUTRIENTS) {
    scores[key] = clamp(scores[key]);
  }

  const overallScore = Math.round(
    NUTRIENTS_FOR_OVERALL.reduce((sum, k) => sum + scores[k], 0) /
      NUTRIENTS_FOR_OVERALL.length,
  );

  const riskTier = getRiskLabel(overallScore).tier;

  const dailyProteinTargetG = calculateProteinTargetG(
    intake.weightLbs,
    intake.activityLevel,
    intake.duration,
    intake.dose,
  );

  return {
    protein: scores.protein,
    b12: scores.b12,
    iron: scores.iron,
    magnesium: scores.magnesium,
    zinc: scores.zinc,
    vitaminD: scores.vitaminD,
    choline: scores.choline,
    potassium: scores.potassium,
    fiber: scores.fiber,
    thiamine: scores.thiamine,
    overallScore,
    riskTier,
    dailyProteinTargetG,
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
  fiber: "Fiber",
  thiamine: "Thiamine (B1)",
};

export const NUTRIENT_KEYS = NUTRIENTS;
