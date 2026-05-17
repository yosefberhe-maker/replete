import type { GIProtocol, Symptom } from "@/types";

/**
 * GI Countermeasure Protocol (Gemini's framing).
 *
 * When the user reports nausea or constipation, Replete shifts beyond
 * recording the symptom into an active protocol: fluid targets, supplement
 * timing and form swaps, and texture/osmolality guidance. Tuned for the
 * specific physiology of slowed gastric emptying on GLP-1s.
 */

export function getGIProtocol(symptoms: Symptom[]): GIProtocol {
  const nausea = symptoms.includes("nausea");
  const constipation = symptoms.includes("constipation");

  if (!nausea && !constipation) {
    return {
      active: false,
      triggers: [],
      fluidTargetLitres: 2,
      priorityRecommendations: [],
      pauseSupplements: [],
      proteinForm: "any",
      notes: [],
    };
  }

  const triggers: Array<"nausea" | "constipation"> = [];
  const priorityRecommendations: string[] = [];
  const pauseSupplements: string[] = [];
  const notes: string[] = [];
  let fluidTargetLitres = 2;
  let proteinForm: GIProtocol["proteinForm"] = "any";

  if (nausea) {
    triggers.push("nausea");
    priorityRecommendations.push(
      "Ginger 250–500 mg with meals — strongest evidence-based anti-nausea botanical (Cochrane 2024).",
      "Digestive enzymes with each meal — supports protein breakdown when gastric acid is reduced.",
      "Small, frequent meals (5–6 × 200 cal) rather than 3 large meals.",
    );
    pauseSupplements.push("iron", "zinc");
    proteinForm = "liquid-only";
    notes.push(
      "Take all supplements with food. Never on an empty stomach during a nausea episode.",
      "If vomiting occurs > 2× in 24 hr, hold the next GLP-1 dose and contact your prescriber.",
    );
    fluidTargetLitres = Math.max(fluidTargetLitres, 2.5);
  }

  if (constipation) {
    triggers.push("constipation");
    priorityRecommendations.push(
      "Resistant dextrin fiber: start 5 g/day with 250 mL extra water, titrate weekly toward 15–25 g.",
      "Magnesium citrate or glycinate at bedtime — gentle motility support (oxide is harsh on GLP-1 stomachs).",
      "Probiotic: 10–50 B CFU Lactobacillus + Bifidobacterium strains — generic 'probiotics' are not equivalent.",
    );
    notes.push(
      "Hydration is the lever, not fiber alone — fiber without water makes constipation worse on slow motility.",
    );
    fluidTargetLitres = Math.max(fluidTargetLitres, 2.5);
    if (proteinForm === "any") proteinForm = "preferred-liquid";
  }

  return {
    active: true,
    triggers,
    fluidTargetLitres,
    priorityRecommendations,
    pauseSupplements,
    proteinForm,
    notes,
  };
}
