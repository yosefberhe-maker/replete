import type { Diet, Dose, Drug, Duration } from "@/types";

export const DRUG_LABEL: Record<Drug, string> = {
  sema: "Semaglutide",
  tirz: "Tirzepatide",
  other: "GLP-1",
};

export const DURATION_LABEL: Record<Duration, string> = {
  "0-3": "Less than 3 months",
  "3-6": "3 to 6 months",
  "6-12": "6 to 12 months",
  "12+": "Over a year",
};

export const DOSE_LABEL: Record<Dose, string> = {
  starter: "Starter dose",
  moderate: "Moderate maintenance dose",
  high: "Full dose",
};

export const DIET_LABEL: Record<Diet, string> = {
  omni: "omnivore",
  veg: "vegetarian",
  vegan: "vegan",
  keto: "keto",
};
