/**
 * Replete shared types. Single source of truth for the deficiency engine,
 * intake wizard, and results dashboard.
 */

export type Drug = "sema" | "tirz" | "other";
export type Duration = "0-3" | "3-6" | "6-12" | "12+";
export type Dose = "starter" | "moderate" | "high";
export type Diet = "omni" | "veg" | "vegan" | "keto";
export type Symptom =
  | "fatigue"
  | "hairloss"
  | "muscle"
  | "brainfog"
  | "nausea"
  | "none";

export interface IntakeData {
  drug: Drug;
  duration: Duration;
  dose: Dose;
  diet: Diet;
  symptoms: Symptom[];
}

export type NutrientKey =
  | "protein"
  | "b12"
  | "iron"
  | "magnesium"
  | "zinc"
  | "vitaminD"
  | "choline"
  | "potassium";

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
  overallScore: number;
  riskTier: RiskTier;
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
  generatedAt: string;
}
