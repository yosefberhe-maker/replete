import { describe, expect, it } from "vitest";
import {
  calculateDeficiencies,
  getRiskLabel,
  NUTRIENT_KEYS,
} from "@/lib/deficiency-engine";
import { getSupplementRecommendations } from "@/lib/supplement-data";
import { getMealPlan } from "@/lib/meal-data";
import type {
  Diet,
  Dose,
  Drug,
  Duration,
  IntakeData,
  Symptom,
} from "@/types";

const baseIntake: IntakeData = {
  drug: "sema",
  duration: "0-3",
  dose: "starter",
  diet: "omni",
  symptoms: ["none"],
};

const drugs: Drug[] = ["sema", "tirz", "other"];
const durations: Duration[] = ["0-3", "3-6", "6-12", "12+"];
const doses: Dose[] = ["starter", "moderate", "high"];
const diets: Diet[] = ["omni", "veg", "vegan", "keto"];
const symptoms: Symptom[] = [
  "fatigue",
  "hairloss",
  "muscle",
  "brainfog",
  "nausea",
  "none",
];

describe("getRiskLabel", () => {
  it("returns high for >= 65", () => {
    expect(getRiskLabel(65)).toEqual({ label: "High Risk", tier: "high" });
    expect(getRiskLabel(80)).toEqual({ label: "High Risk", tier: "high" });
    expect(getRiskLabel(95)).toEqual({ label: "High Risk", tier: "high" });
  });

  it("returns moderate for [40, 65)", () => {
    expect(getRiskLabel(40).tier).toBe("moderate");
    expect(getRiskLabel(50).tier).toBe("moderate");
    expect(getRiskLabel(64).tier).toBe("moderate");
  });

  it("returns low for < 40", () => {
    expect(getRiskLabel(39).tier).toBe("low");
    expect(getRiskLabel(0).tier).toBe("low");
  });
});

describe("calculateDeficiencies — score bounds", () => {
  it("clamps every nutrient to [0, 95]", () => {
    for (const drug of drugs) {
      for (const duration of durations) {
        for (const dose of doses) {
          for (const diet of diets) {
            const profile = calculateDeficiencies({
              drug,
              duration,
              dose,
              diet,
              symptoms,
            });
            for (const key of NUTRIENT_KEYS) {
              const v = profile[key];
              expect(v).toBeGreaterThanOrEqual(0);
              expect(v).toBeLessThanOrEqual(95);
            }
            expect(profile.overallScore).toBeGreaterThanOrEqual(0);
            expect(profile.overallScore).toBeLessThanOrEqual(95);
          }
        }
      }
    }
  });
});

describe("calculateDeficiencies — diet modifiers", () => {
  it("vegan adds B12 (+40) over omni", () => {
    const omni = calculateDeficiencies({ ...baseIntake, diet: "omni" });
    const vegan = calculateDeficiencies({ ...baseIntake, diet: "vegan" });
    expect(vegan.b12 - omni.b12).toBe(40);
  });

  it("vegetarian adds B12 (+28) over omni", () => {
    const omni = calculateDeficiencies({ ...baseIntake, diet: "omni" });
    const veg = calculateDeficiencies({ ...baseIntake, diet: "veg" });
    expect(veg.b12 - omni.b12).toBe(28);
  });

  it("keto adds magnesium (+20) over omni", () => {
    const omni = calculateDeficiencies({ ...baseIntake, diet: "omni" });
    const keto = calculateDeficiencies({ ...baseIntake, diet: "keto" });
    expect(keto.magnesium - omni.magnesium).toBe(20);
  });

  it("keto raises potassium signal (+25) over omni", () => {
    const omni = calculateDeficiencies({ ...baseIntake, diet: "omni" });
    const keto = calculateDeficiencies({ ...baseIntake, diet: "keto" });
    expect(keto.potassium - omni.potassium).toBe(25);
  });
});

describe("calculateDeficiencies — duration + dose", () => {
  it("12+ duration is the strongest non-symptom modifier", () => {
    const early = calculateDeficiencies(baseIntake);
    const late = calculateDeficiencies({ ...baseIntake, duration: "12+" });
    for (const key of NUTRIENT_KEYS) {
      expect(late[key]).toBeGreaterThanOrEqual(early[key]);
    }
  });

  it("starter dose produces lower scores than high dose", () => {
    const starter = calculateDeficiencies(baseIntake);
    const high = calculateDeficiencies({ ...baseIntake, dose: "high" });
    expect(high.overallScore).toBeGreaterThan(starter.overallScore);
  });

  it("covers every duration/dose combination without error", () => {
    for (const duration of durations) {
      for (const dose of doses) {
        const profile = calculateDeficiencies({
          ...baseIntake,
          duration,
          dose,
        });
        expect(profile.overallScore).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

describe("calculateDeficiencies — symptom signals", () => {
  it("fatigue raises iron, b12, vitaminD", () => {
    const none = calculateDeficiencies({ ...baseIntake, symptoms: ["none"] });
    const fatigue = calculateDeficiencies({
      ...baseIntake,
      symptoms: ["fatigue"],
    });
    expect(fatigue.iron - none.iron).toBe(20);
    expect(fatigue.b12 - none.b12).toBe(15);
    expect(fatigue.vitaminD - none.vitaminD).toBe(12);
  });

  it("hairloss raises zinc, iron, protein", () => {
    const none = calculateDeficiencies({ ...baseIntake, symptoms: ["none"] });
    const hair = calculateDeficiencies({
      ...baseIntake,
      symptoms: ["hairloss"],
    });
    expect(hair.zinc - none.zinc).toBe(25);
    expect(hair.iron - none.iron).toBe(15);
    expect(hair.protein - none.protein).toBe(20);
  });

  it("muscle raises protein + magnesium", () => {
    const none = calculateDeficiencies({ ...baseIntake, symptoms: ["none"] });
    const muscle = calculateDeficiencies({
      ...baseIntake,
      symptoms: ["muscle"],
    });
    expect(muscle.protein - none.protein).toBe(30);
    expect(muscle.magnesium - none.magnesium).toBe(15);
  });

  it("brainfog raises choline + B12", () => {
    const none = calculateDeficiencies({ ...baseIntake, symptoms: ["none"] });
    const fog = calculateDeficiencies({
      ...baseIntake,
      symptoms: ["brainfog"],
    });
    expect(fog.choline - none.choline).toBe(25);
    expect(fog.b12 - none.b12).toBe(18);
  });

  it("nausea raises potassium + magnesium", () => {
    const none = calculateDeficiencies({ ...baseIntake, symptoms: ["none"] });
    const nausea = calculateDeficiencies({
      ...baseIntake,
      symptoms: ["nausea"],
    });
    expect(nausea.potassium - none.potassium).toBe(18);
    expect(nausea.magnesium - none.magnesium).toBe(12);
  });

  it("stacks multiple symptoms additively (no double-counting)", () => {
    const profile = calculateDeficiencies({
      ...baseIntake,
      symptoms: ["fatigue", "hairloss"],
    });
    const none = calculateDeficiencies({ ...baseIntake, symptoms: ["none"] });
    // Iron: fatigue +20, hairloss +15 ⇒ +35
    expect(profile.iron - none.iron).toBe(35);
  });
});

describe("calculateDeficiencies — drug modifier", () => {
  it("tirzepatide raises protein (+10) and magnesium (+8)", () => {
    const sema = calculateDeficiencies({ ...baseIntake, drug: "sema" });
    const tirz = calculateDeficiencies({ ...baseIntake, drug: "tirz" });
    expect(tirz.protein - sema.protein).toBe(10);
    expect(tirz.magnesium - sema.magnesium).toBe(8);
  });

  it("other drug leaves scores unchanged from sema baseline", () => {
    const sema = calculateDeficiencies({ ...baseIntake, drug: "sema" });
    const other = calculateDeficiencies({ ...baseIntake, drug: "other" });
    for (const key of NUTRIENT_KEYS) {
      expect(other[key]).toBe(sema[key]);
    }
  });
});

describe("calculateDeficiencies — edge cases", () => {
  it("starter dose at 0-3 months omni produces low overall score", () => {
    const profile = calculateDeficiencies(baseIntake);
    expect(profile.overallScore).toBeLessThan(40);
    expect(profile.riskTier).toBe("low");
  });

  it("12+ months high dose vegan with all symptoms drives high tier", () => {
    const profile = calculateDeficiencies({
      drug: "tirz",
      duration: "12+",
      dose: "high",
      diet: "vegan",
      symptoms: ["fatigue", "hairloss", "muscle", "brainfog", "nausea"],
    });
    expect(profile.riskTier).toBe("high");
    expect(profile.overallScore).toBeGreaterThanOrEqual(65);
  });

  it("empty symptoms array behaves like ['none']", () => {
    const empty = calculateDeficiencies({ ...baseIntake, symptoms: [] });
    const none = calculateDeficiencies({ ...baseIntake, symptoms: ["none"] });
    expect(empty).toEqual(none);
  });
});

describe("supplement-data — SAFETY: potassium is food-only", () => {
  it("returns potassium recommendation as foodOnly for every profile", () => {
    for (const drug of drugs) {
      for (const duration of durations) {
        for (const dose of doses) {
          for (const diet of diets) {
            const profile = calculateDeficiencies({
              drug,
              duration,
              dose,
              diet,
              symptoms,
            });
            const recs = getSupplementRecommendations(profile);
            const potassium = recs.find((r) => r.deficiencyKey === "potassium");
            expect(potassium).toBeDefined();
            expect(potassium?.foodOnly).toBe(true);
            expect(potassium?.name.toLowerCase()).toContain("food only");
            expect(potassium?.dose.toLowerCase()).toContain("food");
            expect(potassium?.caution?.toLowerCase()).toContain(
              "never supplement potassium",
            );
          }
        }
      }
    }
  });

  it("no non-potassium recommendation is marked foodOnly", () => {
    const profile = calculateDeficiencies({
      drug: "tirz",
      duration: "12+",
      dose: "high",
      diet: "vegan",
      symptoms: ["fatigue", "muscle"],
    });
    const recs = getSupplementRecommendations(profile);
    for (const r of recs) {
      if (r.deficiencyKey !== "potassium") {
        expect(r.foodOnly).toBeFalsy();
      }
    }
  });
});

describe("supplement-data — priority + threshold logic", () => {
  it("returns critical priority once protein score >= 65", () => {
    const high = calculateDeficiencies({
      drug: "tirz",
      duration: "12+",
      dose: "high",
      diet: "omni",
      symptoms: ["muscle", "hairloss"],
    });
    const recs = getSupplementRecommendations(high);
    const protein = recs.find((r) => r.deficiencyKey === "protein");
    expect(protein?.priority).toBe("critical");
  });

  it("sorts critical → high → support", () => {
    const profile = calculateDeficiencies({
      drug: "tirz",
      duration: "12+",
      dose: "high",
      diet: "vegan",
      symptoms: ["fatigue", "hairloss", "muscle", "brainfog"],
    });
    const recs = getSupplementRecommendations(profile);
    const rank = { critical: 0, high: 1, support: 2 } as const;
    for (let i = 1; i < recs.length; i++) {
      expect(rank[recs[i].priority]).toBeGreaterThanOrEqual(
        rank[recs[i - 1].priority],
      );
    }
  });

  it("low-risk profile still returns at least potassium food-only", () => {
    const profile = calculateDeficiencies(baseIntake);
    const recs = getSupplementRecommendations(profile);
    expect(recs.length).toBeGreaterThanOrEqual(1);
    expect(recs.some((r) => r.deficiencyKey === "potassium")).toBe(true);
  });
});

describe("meal-data — diet adaptation", () => {
  it("returns 3 days for every diet type", () => {
    for (const diet of diets) {
      const intake: IntakeData = { ...baseIntake, diet };
      const profile = calculateDeficiencies(intake);
      const plan = getMealPlan(intake, profile);
      expect(plan.days).toHaveLength(3);
      for (const day of plan.days) {
        expect(day.meals.length).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("vegan plan never includes obvious animal-source words in meal names", () => {
    const intake: IntakeData = { ...baseIntake, diet: "vegan" };
    const profile = calculateDeficiencies(intake);
    const plan = getMealPlan(intake, profile);
    // Animal-source words that should never appear in a vegan meal name.
    // Excludes "yogurt" / "cheese" since plant variants exist (e.g. soy yogurt).
    const forbidden = [
      "chicken",
      "beef",
      "salmon",
      "shrimp",
      "egg",
      "pork",
      "ribeye",
      "turkey",
      "tuna",
      "cottage cheese",
      "halloumi",
      "paneer",
      "feta",
      "bone broth",
      "cod",
      "sirloin",
    ];
    for (const day of plan.days) {
      for (const meal of day.meals) {
        const lower = meal.name.toLowerCase();
        for (const word of forbidden) {
          expect(lower).not.toContain(word);
        }
      }
    }
  });

  it("every meal has a non-empty why and positive protein estimate", () => {
    for (const diet of diets) {
      const intake: IntakeData = { ...baseIntake, diet };
      const profile = calculateDeficiencies(intake);
      const plan = getMealPlan(intake, profile);
      for (const day of plan.days) {
        for (const meal of day.meals) {
          expect(meal.why.length).toBeGreaterThan(10);
          expect(meal.proteinGrams).toBeGreaterThan(0);
        }
      }
    }
  });
});
