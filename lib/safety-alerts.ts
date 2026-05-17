import type { IntakeData, SafetyAlert } from "@/types";

/**
 * Top-level safety alerts (Gemini's "unsafe supplement stacking" framing).
 *
 * Surfaces hepatotoxic and absorption-impairing risks that GLP-1 users
 * commonly hit when they try to self-medicate fatigue, hair loss, or
 * weight stalls. Shown above the supplement stack on the results page.
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

  alerts.push({
    id: "no-stacked-calcium-iron",
    severity: "info",
    title: "Don't co-dose calcium with iron",
    body: "Calcium blocks iron absorption. If you're on both, separate by 2+ hours. Keep calcium in single doses ≤500 mg — chronic intake above 2,500 mg/day risks hypercalcemia.",
  });

  return alerts;
}
