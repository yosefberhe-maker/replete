import type { IntakeData, SafetyAlert } from "@/types";

/**
 * Top-level safety alerts (Gemini's "unsafe supplement stacking" framing).
 *
 * Surfaces hepatotoxic and absorption-impairing risks that GLP-1 users
 * commonly hit when they try to self-medicate fatigue, hair loss, or
 * weight stalls — plus a bone-density flag for post-menopausal long-duration
 * users where rapid weight loss + reduced calcium intake compound risk.
 */

export function getSafetyAlerts(intake: IntakeData): SafetyAlert[] {
  const alerts: SafetyAlert[] = [];
  const symptoms = new Set(intake.symptoms);

  if (symptoms.has("fatigue")) {
    alerts.push({
      id: "no-thermogenics",
      severity: "warning",
      title: "Avoid thermogenic fat burners and high-dose green tea extract",
      body: "These are hepatotoxic and interact with GLP-1 mechanisms. The fatigue you're feeling is almost certainly nutritional (iron, B12, D) — fix the deficit, don't mask it with stimulants.",
    });
  }

  if (symptoms.has("hairloss")) {
    alerts.push({
      id: "no-mega-biotin",
      severity: "info",
      title: "Skip mega-dose biotin",
      body: "10,000 mcg biotin is a hair-loss-marketing default and is a known interferent with thyroid and cardiac (troponin) lab assays. Address protein, zinc, and ferritin first — they're the actual levers.",
    });
  }

  if (
    intake.sex === "female" &&
    (intake.ageRange === "50-64" || intake.ageRange === "65+") &&
    intake.duration === "12+"
  ) {
    alerts.push({
      id: "bone-health",
      severity: "warning",
      title: "Bone density risk — discuss DEXA timing with your provider",
      body: "Rapid weight loss combined with reduced calcium intake in post-menopausal women on a GLP-1 for 12+ months elevates bone-density risk. Make sure your daily calcium and vitamin D targets are being met from diet + supplements, and ask your provider when a DEXA scan is appropriate.",
    });
  }

  alerts.push({
    id: "no-stacked-calcium-iron",
    severity: "info",
    title: "Calcium dosing + iron separation",
    body: "Aim for 500–1,000 mg/day calcium from supplements combined with dietary sources; do not exceed 1,200 mg total daily unless prescribed. Take any calcium supplement in divided doses ≤500 mg, and not within 2 hours of iron — they compete for absorption.",
  });

  return alerts;
}
