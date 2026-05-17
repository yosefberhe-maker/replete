/**
 * Replete shared types. Single source of truth for the deficiency engine,
 * intake wizard, results dashboard, injection-cycle engine, and GI protocol.
 */

export type Drug = "sema" | "tirz" | "other";
export type Duration = "0-3" | "3-6" | "6-12" | "12+";
export type Dose = "starter" | "moderate" | "high";
export type Diet = "omni" | "veg" | "vegan" | "keto";
export type Sex = "male" | "female";
export type AgeRange = "18-34" | "35-49" | "50-64" | "65+";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active";
export type DayOfWeek =
  | "mon"
  | "tue"
  | "wed"
  | "thu"
  | "fri"
  | "sat"
  | "sun";
export type InjectionTiming = "morning" | "evening";
export type Symptom =
  | "fatigue"
  | "hairloss"
  | "muscle"
  | "brainfog"
  | "nausea"
  | "vomiting"
  | "constipation"
  | "none";

export interface IntakeData {
  drug: Drug;
  duration: Duration;
  dose: Dose;
  weightLbs: number;
  sex: Sex;
  ageRange: AgeRange;
  activityLevel: ActivityLevel;
  diet: Diet;
  symptoms: Symptom[];
  injectionDay: DayOfWeek;
  injectionTiming: InjectionTiming;
}

export type NutrientKey =
  | "protein"
  | "b12"
  | "iron"
  | "magnesium"
  | "zinc"
  | "vitaminD"
  | "choline"
  | "potassium"
  | "fiber"
  | "thiamine";

export type RiskTier = "high" | "moderate" | "low";

export interface DeficiencyProfile {
  protein: number;
  b12: number;
  iron: number;
  magnesium: number;
  zinc: number;
  vitaminD: number;
  choline: number;
  potassium: number;
  fiber: number;
  /**
   * Acute thiamine risk score. Unlike the other nutrients, thiamine does NOT
   * follow the duration/dose pattern — it is driven purely by GI symptoms
   * (nausea, vomiting) because Wernicke's encephalopathy is acute, not
   * gradual. Excluded from the overallScore average for the same reason.
   */
  thiamine: number;
  overallScore: number;
  riskTier: RiskTier;
  /** Body-weight-based daily protein target, in grams. */
  dailyProteinTargetG: number;
}

export type SupplementPriority = "critical" | "high" | "support";

export interface SupplementRecommendation {
  id: string;
  name: string;
  dose: string;
  timing: string;
  form: string;
  why: string;
  priority: SupplementPriority;
  deficiencyKey: NutrientKey;
  icon: string;
  caution?: string;
  /** True if this is a food-only recommendation (e.g. potassium). */
  foodOnly?: boolean;
  /** Daily target amount, formatted for display (e.g. "400 mg/day"). */
  dailyTargetAmount?: string;
  /** Estimated current intake on a GLP-1, for comparison with target. */
  currentEstimatedIntake?: string;
  /** Unsafe-stacking or drug-interaction warning. */
  safetyNote?: string;
}

export type CyclePhase = "peak" | "plateau" | "trough";

export interface CycleAdvice {
  phase: CyclePhase;
  dayOfCycle: number;
  headline: string;
  actions: string[];
  avoid: string[];
}

export interface GIProtocol {
  active: boolean;
  triggers: Array<"nausea" | "vomiting" | "constipation">;
  fluidTargetLitres: number;
  priorityRecommendations: string[];
  pauseSupplements: string[];
  proteinForm: "liquid-only" | "preferred-liquid" | "any";
  notes: string[];
  /** True if persistent vomiting flagged — surfaces the thiamine/Wernicke's notice. */
  thiamineUrgent: boolean;
}

export interface SafetyAlert {
  id: string;
  severity: "warning" | "info";
  title: string;
  body: string;
}

export interface Meal {
  type: "Breakfast" | "Lunch" | "Dinner" | "Snack";
  name: string;
  why: string;
  proteinGrams: number;
}

export interface MealDay {
  day: number;
  title: string;
  meals: Meal[];
}

export interface MealPlan {
  days: MealDay[];
  philosophy: string;
  keyPrinciples: string[];
}

export interface CompleteProfile {
  intake: IntakeData;
  profile: DeficiencyProfile;
  supplements: SupplementRecommendation[];
  mealPlan: MealPlan;
  cycle: CycleAdvice;
  gi: GIProtocol;
  safetyAlerts: SafetyAlert[];
  generatedAt: string;
}
