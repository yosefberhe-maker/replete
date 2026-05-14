import type {
  DeficiencyProfile,
  NutrientKey,
  SupplementPriority,
  SupplementRecommendation,
} from "@/types";

/**
 * Supplement recommendation engine.
 *
 * SAFETY RULE — POTASSIUM IS ALWAYS FOOD ONLY.
 * Never return a potassium *supplement* recommendation. Potassium supplements
 * can cause hyperkalemia → cardiac arrhythmia. The user is directed to food
 * sources only. This rule is enforced both in the data and in tests; do not
 * remove without explicit clinical sign-off.
 */

type Threshold = {
  /** Minimum score required to include this recommendation at all. */
  show: number;
  /** At or above this score, recommendation is upgraded to "critical". */
  critical?: number;
  /** At or above this score, recommendation is at least "high". */
  high: number;
};

type SupplementDef = Omit<SupplementRecommendation, "priority"> & {
  thresholds: Threshold;
};

const PRIORITY_RANK: Record<SupplementPriority, number> = {
  critical: 0,
  high: 1,
  support: 2,
};

const SUPPLEMENTS: SupplementDef[] = [
  {
    id: "protein",
    name: "Protein blend",
    deficiencyKey: "protein",
    dose: "25–35 g per day",
    timing: "Within 30 min of waking; second serving post-workout or with dinner",
    form: "Whey isolate, or pea + rice blend for plant-based",
    why: "GLP-1s suppress appetite by ~30–40%. Lean mass loss is the most documented downside — protein intake has to stay constant even as calories drop.",
    icon: "🥩",
    thresholds: { show: 40, high: 50, critical: 65 },
  },
  {
    id: "magnesium",
    name: "Magnesium glycinate",
    deficiencyKey: "magnesium",
    dose: "200–400 mg",
    timing: "30 min before bed",
    form: "Glycinate (not oxide — poor absorption, GI distress)",
    why: "Magnesium intake collapses with smaller meals. Deficiency drives muscle cramps, poor sleep, and nausea — three top GLP-1 complaints.",
    icon: "🌙",
    thresholds: { show: 35, high: 60 },
  },
  {
    id: "b12",
    name: "Vitamin B12",
    deficiencyKey: "b12",
    dose: "1000 mcg",
    timing: "Morning, away from coffee",
    form: "Methylcobalamin sublingual",
    why: "Reduced food intake + slowed gastric emptying lower B12 absorption. Deficiency presents as fatigue and brain fog — both common at 6+ months.",
    icon: "⚡",
    thresholds: { show: 35, high: 50, critical: 65 },
  },
  {
    id: "vitaminD",
    name: "Vitamin D3 + K2",
    deficiencyKey: "vitaminD",
    dose: "2000–4000 IU D3 + 100 mcg K2 (MK-7)",
    timing: "With your largest fat-containing meal",
    form: "D3 (cholecalciferol) with K2 for bone/cardiovascular co-factor",
    why: "Lower food volume = less ambient D intake. K2 directs calcium away from arteries to bone — important when supplementing higher doses of D.",
    icon: "☀️",
    thresholds: { show: 30, high: 55 },
  },
  {
    id: "zinc",
    name: "Zinc picolinate",
    deficiencyKey: "zinc",
    dose: "25–50 mg",
    timing: "With food (never on empty stomach — nausea)",
    form: "Picolinate or bisglycinate",
    why: "Zinc is the single biggest lever on hair retention. Deficiency also impairs immune function and taste — both reported by long-term GLP-1 users.",
    icon: "🛡",
    thresholds: { show: 40, high: 55, critical: 65 },
    caution:
      "Do not exceed 50 mg/day long-term — high zinc displaces copper. Take with a meal.",
  },
  {
    id: "iron",
    name: "Iron bisglycinate",
    deficiencyKey: "iron",
    dose: "18–36 mg",
    timing: "Morning, with vitamin C; away from coffee, tea, calcium",
    form: "Ferrous bisglycinate (gentle on GI vs. ferrous sulfate)",
    why: "Iron requires adequate intake of red meat, beans, or fortified grains — all of which drop sharply on GLP-1s. Low iron → fatigue + hair thinning.",
    icon: "🩸",
    thresholds: { show: 40, high: 50, critical: 65 },
    caution:
      "If you have a known iron disorder (hemochromatosis) or have not been tested, get a ferritin lab before supplementing.",
  },
  {
    id: "choline",
    name: "CDP-Choline (citicoline)",
    deficiencyKey: "choline",
    dose: "250–500 mg",
    timing: "Morning",
    form: "Citicoline (CDP-Choline) — more bioavailable than choline bitartrate",
    why: "Choline is the most underrated GLP-1 deficiency. Eggs, liver, and beef are the top sources — exactly the foods people eat less of. Deficiency drives brain fog.",
    icon: "🧠",
    thresholds: { show: 40, high: 60 },
  },
];

/**
 * Potassium recommendation — ALWAYS food-only. Returned for every profile so
 * the user sees the cautionary guidance regardless of risk score.
 */
const POTASSIUM_FOOD_ONLY: SupplementRecommendation = {
  id: "potassium",
  name: "Potassium (food only)",
  deficiencyKey: "potassium",
  dose: "Aim for 3,500–4,700 mg/day from food",
  timing: "Spread across meals",
  form:
    "Dietary sources only: avocado (1/2 = 487 mg), spinach (1 cup cooked = 840 mg), sweet potato (1 medium = 540 mg), banana (1 medium = 420 mg), white beans, salmon.",
  why: "Potassium needs are real on GLP-1s — especially with nausea or low-carb diets. But potassium supplements can cause hyperkalemia (cardiac arrhythmia). Always increase via food. If you suspect deficiency, get a lab.",
  priority: "support",
  icon: "🥑",
  caution:
    "Never supplement potassium without lab work. This is a safety rule, not a preference.",
  foodOnly: true,
};

function resolvePriority(
  score: number,
  thresholds: Threshold,
): SupplementPriority | null {
  if (score < thresholds.show) return null;
  if (thresholds.critical !== undefined && score >= thresholds.critical) {
    return "critical";
  }
  if (score >= thresholds.high) return "high";
  return "support";
}

export function getSupplementRecommendations(
  profile: DeficiencyProfile,
): SupplementRecommendation[] {
  const recs: SupplementRecommendation[] = [];

  for (const def of SUPPLEMENTS) {
    const score = profile[def.deficiencyKey];
    const priority = resolvePriority(score, def.thresholds);
    if (priority === null) continue;
    const { thresholds, ...rest } = def;
    void thresholds;
    recs.push({ ...rest, priority });
  }

  recs.push(POTASSIUM_FOOD_ONLY);

  recs.sort((a, b) => {
    const byPriority = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority];
    if (byPriority !== 0) return byPriority;
    return profile[b.deficiencyKey] - profile[a.deficiencyKey];
  });

  return recs;
}

/** Exported for tests + future analytics. */
export const SUPPLEMENT_KEYS: NutrientKey[] = SUPPLEMENTS.map(
  (s) => s.deficiencyKey,
);
