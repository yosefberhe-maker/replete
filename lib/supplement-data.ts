import type {
  DeficiencyProfile,
  IntakeData,
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
 *
 * All `why` strings cite 2025-2026 clinical sources; the supplement engine
 * also returns quantitative daily targets, estimated current intake on a
 * GLP-1, and safety notes for drug interactions and unsafe stacking.
 */

type Threshold = {
  /** Minimum score required to include this recommendation at all. */
  show: number;
  /** At or above this score, recommendation is upgraded to "critical". */
  critical?: number;
  /** At or above this score, recommendation is at least "high". */
  high: number;
};

type SupplementDef = Omit<
  SupplementRecommendation,
  "priority" | "dailyTargetAmount" | "currentEstimatedIntake"
> & {
  thresholds: Threshold;
  resolveTarget?: (
    intake: IntakeData,
    profile: DeficiencyProfile,
  ) => { dailyTargetAmount: string; currentEstimatedIntake: string };
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
    dose: "25–35 g per serving · 2 servings/day typical",
    timing:
      "Within 30 min of waking; second serving post-workout or with dinner",
    form: "Whey isolate, or pea + rice blend for plant-based",
    why: "GLP-1 users average 45–65 g/day vs the 1.2–2.0 g/kg/day target (Johnson et al. 2025, Obesity Pillars, PMID 41368199). Like all calorie-deficit weight loss, 25–45% of weight lost can come from lean tissue (STEP 1: ~45% semaglutide, PMC8089287; SURMOUNT-1: ~25% tirzepatide, PMC11965027). This isn't unique to GLP-1s — it's true of any rapid deficit — but it's why protein targeting and resistance training matter: users who meet their target preserve significantly more muscle.",
    icon: "🥩",
    thresholds: { show: 40, high: 50, critical: 65 },
    resolveTarget: (_intake, profile) => ({
      dailyTargetAmount: `${profile.dailyProteinTargetG} g/day`,
      currentEstimatedIntake: "~45–65 g/day on GLP-1 average",
    }),
  },
  {
    id: "magnesium",
    name: "Magnesium glycinate",
    deficiencyKey: "magnesium",
    dose: "200–400 mg",
    timing: "30 min before bed",
    form: "Glycinate (not oxide — poor absorption, worsens existing GLP-1 motility issues)",
    why: "GLP-1 users average 266 mg/day vs the 400–420 mg RDA (cross-sectional study, n=69; Frontiers in Nutrition, March 2025, DOI 10.3389/fnut.2025.1566498). Glycinate is preferred — oxide drives GI distress in an already slow-emptying stomach.",
    icon: "🌙",
    thresholds: { show: 35, high: 60 },
    resolveTarget: () => ({
      dailyTargetAmount: "400 mg/day",
      currentEstimatedIntake: "~266 mg/day (GLP-1 average)",
    }),
    safetyNote:
      "Avoid oxide form — poor absorption and irritates GI tract. Glycinate or citrate only.",
  },
  {
    id: "b12",
    name: "Vitamin B12",
    deficiencyKey: "b12",
    dose: "1000 mcg",
    timing: "Morning, away from coffee",
    form: "Methylcobalamin sublingual",
    why: "Reduced food intake plus slowed gastric emptying lowers B12 absorption. Methylcobalamin sublingual bypasses gastric uptake — relevant for any GLP-1 user past 6 months.",
    icon: "⚡",
    thresholds: { show: 35, high: 50, critical: 65 },
    resolveTarget: () => ({
      dailyTargetAmount: "2.4 mcg/day RDA (1000 mcg supplemented for absorption)",
      currentEstimatedIntake: "Variable — diet-dependent",
    }),
  },
  {
    id: "vitaminD",
    name: "Vitamin D3 + K2",
    deficiencyKey: "vitaminD",
    dose: "2000–4000 IU D3 + 100 mcg K2 (MK-7)",
    timing: "With your largest fat-containing meal",
    form: "D3 (cholecalciferol) with K2 for bone/cardiovascular co-factor",
    why: "13.6% of long-term GLP-1 users develop vitamin D deficiency by 12 months vs 7.5% at 6 months (Butsch et al. 2025, Obesity Pillars, n=461,382; DOI 10.1016/j.obpill.2025.100186). Reduced dietary volume and sun-seeking behavior both contribute.",
    icon: "☀️",
    thresholds: { show: 30, high: 55 },
    resolveTarget: (_intake, profile) => ({
      dailyTargetAmount:
        profile.vitaminD >= 65 ? "4000 IU/day" : "2000 IU/day",
      currentEstimatedIntake: "~400–600 IU/day from diet (US average)",
    }),
    safetyNote:
      "If supplementing >2000 IU D3, pair with K2 (MK-7) and ensure adequate calcium: 500–1,000 mg/day from supplements combined with dietary sources, not exceeding 1,200 mg total daily unless prescribed (adapted from obesity-medicine guidance — case reports flag hypercalcemia risk on GLP-1s). Take any calcium supplement in divided doses ≤500 mg, and never within 2 hours of iron.",
  },
  {
    id: "zinc",
    name: "Zinc picolinate",
    deficiencyKey: "zinc",
    dose: "25–50 mg",
    timing: "With food (never on empty stomach — nausea)",
    form: "Picolinate or bisglycinate",
    why: "Zinc is the single biggest mineral lever on hair retention. Deficiency also impairs immune function and taste — both reported by long-term GLP-1 users.",
    icon: "🛡",
    thresholds: { show: 40, high: 55, critical: 65 },
    resolveTarget: () => ({
      dailyTargetAmount: "8–11 mg/day RDA · 25 mg supplemented",
      currentEstimatedIntake: "Below RDA on reduced-volume diets",
    }),
    caution:
      "Do not exceed 50 mg/day long-term — high zinc displaces copper. Take with a meal.",
  },
  {
    id: "iron",
    name: "Iron bisglycinate",
    deficiencyKey: "iron",
    dose: "18–36 mg",
    timing: "Morning, with vitamin C; away from coffee, tea, calcium, thyroid meds",
    form: "Ferrous bisglycinate (gentle on GI vs. ferrous sulfate)",
    why: "Mechanistic evidence suggests GLP-1 receptor agonists reduce intestinal iron absorption (Melis et al. 2025, Diabetes Obesity Metab, n=51). Women of reproductive age face compounded depletion from menstrual losses on a reduced-volume diet. Excess iron is hepatotoxic — confirm serum ferritin before supplementing.",
    icon: "🩸",
    thresholds: { show: 40, high: 50, critical: 65 },
    resolveTarget: (intake) => {
      const preMenopausalFemale =
        intake.sex === "female" &&
        (intake.ageRange === "18-34" || intake.ageRange === "35-49");
      return {
        dailyTargetAmount: preMenopausalFemale ? "18 mg/day" : "8 mg/day",
        currentEstimatedIntake: preMenopausalFemale
          ? "Most pre-menopausal women on GLP-1 fall short"
          : "Below RDI on reduced-volume diets",
      };
    },
    caution:
      "If you have a known iron disorder (hemochromatosis) or have not been tested, get a ferritin lab before supplementing.",
    safetyNote:
      "Do not take within 2 hours of thyroid medication, coffee, tea, or calcium — all impair absorption. Confirm ferritin before starting.",
  },
  {
    id: "choline",
    name: "CDP-Choline (citicoline)",
    deficiencyKey: "choline",
    dose: "250–500 mg",
    timing: "Morning",
    form: "Citicoline (CDP-Choline) — more bioavailable than choline bitartrate",
    why: "GLP-1 users average 305 mg/day vs 425–550 mg adequate intake (cross-sectional study, n=69; Frontiers in Nutrition, March 2025, DOI 10.3389/fnut.2025.1566498). Choline supports hepatic fat metabolism — relevant because rapid GLP-1 weight loss can trigger transient NAFLD.",
    icon: "🧠",
    thresholds: { show: 40, high: 60 },
    resolveTarget: (intake) => ({
      dailyTargetAmount:
        intake.sex === "female" ? "425 mg/day AI" : "550 mg/day AI",
      currentEstimatedIntake: "~305 mg/day (GLP-1 average)",
    }),
  },
  {
    id: "fiber",
    name: "Resistant dextrin fiber",
    deficiencyKey: "fiber",
    dose: "Start 5 g/day, titrate to 15–25 g over 4 weeks",
    timing: "Split into 2 doses with meals; add 250 mL extra water per serving",
    form: "Resistant dextrin (e.g. Benefiber) — low-osmolality, GI-tolerable for slow gastric emptying",
    why: "GLP-1 users average 14.5 g/day vs the 25–38 g RDA (cross-sectional study, n=69; Frontiers in Nutrition, March 2025, DOI 10.3389/fnut.2025.1566498). Critical for managing constipation on slow-emptying gastric motility.",
    icon: "🌾",
    thresholds: { show: 40, high: 60, critical: 80 },
    resolveTarget: (intake) => ({
      dailyTargetAmount:
        intake.sex === "female" ? "25 g/day" : "38 g/day",
      currentEstimatedIntake: "~14.5 g/day (GLP-1 average)",
    }),
    safetyNote:
      "Start low (5 g) and titrate weekly. Insoluble bran and high-osmolality fibers (psyllium in large doses, inulin) can worsen GLP-1 bloating.",
  },
  {
    id: "thiamine",
    name: "Thiamine (Vitamin B1)",
    deficiencyKey: "thiamine",
    dose: "100 mg/day if vomiting present; B-complex covers maintenance",
    timing:
      "With food; IV/IM administration may be needed if vomiting is severe — consult your prescribing provider",
    form: "Thiamine hydrochloride or benfotiamine; B-complex for routine maintenance",
    why: "Rare but serious: Wernicke's encephalopathy cases have been reported in GLP-1 users with prolonged vomiting (Urbina et al. 2026, narrative review of case reports). Prolonged GI symptoms combined with reduced intake deplete thiamine rapidly; a standard multivitamin provides ~1.1 mg, but therapeutic doses are needed if vomiting persists.",
    icon: "💊",
    thresholds: { show: 40, high: 60, critical: 80 },
    resolveTarget: () => ({
      dailyTargetAmount:
        "100 mg/day if vomiting present; routine multivitamin coverage otherwise",
      currentEstimatedIntake: "~1.1 mg/day from a standard multivitamin",
    }),
    caution:
      "If experiencing persistent vomiting, discuss thiamine supplementation with your prescribing provider. Wernicke's encephalopathy is rare but serious — symptoms include confusion, vision changes, and balance problems.",
    safetyNote:
      "Severe or persistent vomiting on a GLP-1 needs urgent clinical evaluation, not just self-supplementation. This guidance covers thiamine specifically — not the underlying GI issue, which may require dose reduction or IV thiamine.",
  },
];

const POTASSIUM_FOOD_ONLY: SupplementRecommendation = {
  id: "potassium",
  name: "Potassium (food only)",
  deficiencyKey: "potassium",
  dose: "Aim for 3,500–4,700 mg/day from food",
  timing: "Spread across meals",
  form: "Dietary sources only: avocado (½ = 487 mg), spinach (1 cup cooked = 840 mg), sweet potato (1 medium = 540 mg), banana (1 medium = 420 mg), white beans, salmon.",
  why: "Potassium needs are real on GLP-1s — especially with nausea or low-carb diets. But potassium supplements can cause hyperkalemia (cardiac arrhythmia). Always increase via food. If you suspect deficiency, get a lab.",
  priority: "support",
  icon: "🥑",
  caution:
    "Never supplement potassium without lab work. This is a safety rule, not a preference.",
  foodOnly: true,
  dailyTargetAmount: "3,500–4,700 mg/day from food",
  currentEstimatedIntake:
    "~2,186 mg/day (Frontiers in Nutrition, March 2025, cross-sectional n=69)",
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
  intake: IntakeData,
): SupplementRecommendation[] {
  const recs: SupplementRecommendation[] = [];

  for (const def of SUPPLEMENTS) {
    const score = profile[def.deficiencyKey];
    const priority = resolvePriority(score, def.thresholds);
    if (priority === null) continue;
    const { thresholds, resolveTarget, ...rest } = def;
    void thresholds;
    const targets = resolveTarget ? resolveTarget(intake, profile) : {};
    recs.push({ ...rest, ...targets, priority });
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
