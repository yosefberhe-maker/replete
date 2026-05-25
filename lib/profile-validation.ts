import type { CompleteProfile } from "@/types";
import type { SharedProfile } from "@/lib/storage";
import { DRUG_LABEL, DURATION_LABEL, DIET_LABEL, DOSE_LABEL } from "@/lib/copy";

export function isCompleteProfile(value: unknown): value is CompleteProfile {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    "intake" in v &&
    "profile" in v &&
    "supplements" in v &&
    "mealPlan" in v &&
    "cycle" in v &&
    "gi" in v &&
    "safetyAlerts" in v
  );
}

export function isRenderableSharedProfile(
  shared: SharedProfile | null,
): shared is SharedProfile {
  if (shared === null || typeof shared !== "object") return false;
  return (
    typeof shared.code === "string" &&
    shared.drug in DRUG_LABEL &&
    shared.duration in DURATION_LABEL &&
    shared.diet in DIET_LABEL &&
    shared.dose in DOSE_LABEL &&
    typeof shared.overallScore === "number" &&
    Array.isArray(shared.topDeficiencies) &&
    Array.isArray(shared.supplements)
  );
}
