import type { GIProtocol, Symptom } from "@/types";

/**
 * GI Countermeasure Protocol (Gemini's framing).
 *
 * When the user reports nausea, vomiting, or constipation, Replete shifts
 * beyond recording the symptom into an active protocol: fluid targets,
 * supplement timing and form swaps, and texture/osmolality guidance. Tuned
 * for the specific physiology of slowed gastric emptying on GLP-1s.
 *
 * Vomiting additionally flips the `thiamineUrgent` flag so the results page
 * surfaces the Wernicke's encephalopathy warning prominently — case reports
 * exist in GLP-1 users with prolonged vomiting (Urbina et al. 2026).
 */

export function getGIProtocol(symptoms: Symptom[]): GIProtocol {
  const nausea = symptoms.includes("nausea");
  const vomiting = symptoms.includes("vomiting");
  const constipation = symptoms.includes("constipation");

  if (!nausea && !vomiting && !constipation) {
    return {
      active: false,
      triggers: [],
      fluidTargetLitres: 2,
      priorityRecommendations: [],
      pauseSupplements: [],
      proteinForm: "any",
      notes: [],
      thiamineUrgent: false,
    };
  }

  const triggers: Array<"nausea" | "vomiting" | "constipation"> = [];
  const priorityRecommendations: string[] = [];
  const pauseSupplements: string[] = [];
  const notes: string[] = [];
  let fluidTargetLitres = 2;
  let proteinForm: GIProtocol["proteinForm"] = "any";

  if (vomiting) {
    triggers.push("vomiting");
    priorityRecommendations.push(
      "Urgent: persistent vomiting on a GLP-1 warrants a call to your prescribing provider. Thiamine (B1) supplementation may be indicated — Wernicke's encephalopathy is rare but serious.",
      "Oral rehydration salts (ORS) or unflavored Pedialyte in small frequent sips while symptoms are active.",
      "Hold solid foods if vomiting recurs > 2× in 24 hr; resume with bland liquids first (broth, dilute juice).",
    );
    pauseSupplements.push("iron", "zinc", "magnesium oxide");
    proteinForm = "liquid-only";
    notes.push(
      "If you cannot keep fluids down for 24+ hr, contact your prescriber — dose reduction or IV thiamine may be needed.",
      "Wernicke's symptoms: confusion, vision changes, balance problems. Seek urgent care if any appear.",
    );
    fluidTargetLitres = Math.max(fluidTargetLitres, 3);
  }

  if (nausea) {
    triggers.push("nausea");
    priorityRecommendations.push(
      "Ginger 250–500 mg with meals — strongest evidence-based anti-nausea botanical (Cochrane 2024).",
      "Digestive enzymes with each meal — supports protein breakdown when gastric acid is reduced.",
      "Small, frequent meals (5–6 × 200 cal) rather than 3 large meals.",
    );
    if (!pauseSupplements.includes("iron")) pauseSupplements.push("iron");
    if (!pauseSupplements.includes("zinc")) pauseSupplements.push("zinc");
    if (proteinForm === "any") proteinForm = "liquid-only";
    notes.push(
      "Take all supplements with food. Never on an empty stomach during a nausea episode.",
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
    thiamineUrgent: vomiting,
  };
}
