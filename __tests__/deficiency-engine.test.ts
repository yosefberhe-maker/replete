import { describe, expect, it } from "vitest";
import {
  calculateDeficiencies,
  calculateProteinTargetG,
  getRiskLabel,
  NUTRIENT_KEYS,
} from "@/lib/deficiency-engine";
import { getSupplementRecommendations } from "@/lib/supplement-data";
import { getMealPlan } from "@/lib/meal-data";
import { getCycleAdvice, getCyclePhase } from "@/lib/injection-cycle";
import { getGIProtocol } from "@/lib/gi-protocol";
import { getSafetyAlerts } from "@/lib/safety-alerts";
import type {
  ActivityLevel,
  AgeRange,
  Diet,
  Dose,
  Drug,
  Duration,
  IntakeData,
  Sex,
  Symptom,
} from "@/types";

const baseIntake: IntakeData = {
  drug: "sema",
  duration: "0-3",
  dose: "starter",
  diet: "omni",
  symptoms: ["none"],
  sex: "male",
  ageRange: "35-49",
  activityLevel: "moderate",
  weightLbs: 180,
  injectionDay: "mon",
  injectionTiming: "morning",
};

const drugs: Drug[] = ["sema", "tirz", "other"];
const durations: Duration[] = ["0-3", "3-6", "6-12", "12+"];
const doses: Dose[] = ["starter", "moderate", "high"];
const diets: Diet[] = ["omni", "veg", "vegan", "keto"];
const sexes: Sex[] = ["male", "female"];
const ages: AgeRange[] = ["18-34", "35-49", "50-64", "65+"];
const activities: ActivityLevel[] = [
  "sedentary",
  "light",
  "moderate",
  "active",
];
const symptoms: Symptom[] = [
  "fatigue",
  "hairloss",
  "muscle",
  "brainfog",
  "nausea",
  "vomiting",
  "constipation",
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
              ...baseIntake,
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

  it("keto raises choline (+10) over omni baseline", () => {
    const omni = calculateDeficiencies({ ...baseIntake, diet: "omni" });
    const keto = calculateDeficiencies({ ...baseIntake, diet: "keto" });
    expect(keto.choline - omni.choline).toBe(10);
  });
});

describe("calculateDeficiencies — fiber is a universal gap", () => {
  it("starts at base 70 for every diet at starter dose / 0-3 months", () => {
    for (const diet of diets) {
      const profile = calculateDeficiencies({ ...baseIntake, diet });
      expect(profile.fiber).toBeGreaterThanOrEqual(70);
    }
  });

  it("constipation symptom raises fiber +20", () => {
    const none = calculateDeficiencies({ ...baseIntake, symptoms: ["none"] });
    const con = calculateDeficiencies({
      ...baseIntake,
      symptoms: ["constipation"],
    });
    expect(con.fiber - none.fiber).toBe(20);
  });
});

describe("calculateDeficiencies — choline baseline", () => {
  it("uses 55 as base (Grok: 305 mg avg vs 425-550 AI)", () => {
    const profile = calculateDeficiencies(baseIntake);
    expect(profile.choline).toBeGreaterThanOrEqual(55);
  });
});

describe("calculateDeficiencies — vitamin D long-duration jump", () => {
  it("12+ months adds an EXTRA +25 to vitamin D beyond standard duration boost", () => {
    const early = calculateDeficiencies({ ...baseIntake, duration: "0-3" });
    const sixMo = calculateDeficiencies({ ...baseIntake, duration: "6-12" });
    const yearPlus = calculateDeficiencies({ ...baseIntake, duration: "12+" });
    // 12+ duration boost is 52, 0-3 is 0 → +52 standard.
    // Plus extra +25 long-duration vitamin D boost → +77 (clamped to 95 if base+other pushes over).
    expect(yearPlus.vitaminD - early.vitaminD).toBeGreaterThan(
      sixMo.vitaminD - early.vitaminD,
    );
  });
});

describe("calculateDeficiencies — sex modifier on iron", () => {
  it("pre-menopausal women (18-34, 35-49) get +15 iron", () => {
    const male = calculateDeficiencies({
      ...baseIntake,
      sex: "male",
      ageRange: "35-49",
    });
    const female = calculateDeficiencies({
      ...baseIntake,
      sex: "female",
      ageRange: "35-49",
    });
    expect(female.iron - male.iron).toBe(15);
  });

  it("post-menopausal women (50-64, 65+) do not get the iron boost", () => {
    const male = calculateDeficiencies({
      ...baseIntake,
      sex: "male",
      ageRange: "65+",
    });
    const female = calculateDeficiencies({
      ...baseIntake,
      sex: "female",
      ageRange: "65+",
    });
    expect(female.iron).toBe(male.iron);
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

describe("calculateProteinTargetG", () => {
  it("uses 1.2 g/kg as baseline for moderate activity", () => {
    const target = calculateProteinTargetG(180, "moderate", "0-3", "starter");
    const kg = 180 / 2.2046;
    expect(target).toBe(Math.round(kg * 1.2));
  });

  it("bumps to 1.6 g/kg for active users", () => {
    const target = calculateProteinTargetG(180, "active", "0-3", "starter");
    const kg = 180 / 2.2046;
    expect(target).toBe(Math.round(kg * 1.6));
  });

  it("bumps to 2.0 g/kg for long-duration + high-dose", () => {
    const target = calculateProteinTargetG(180, "moderate", "12+", "high");
    const kg = 180 / 2.2046;
    expect(target).toBe(Math.round(kg * 2.0));
  });
});

describe("calculateDeficiencies — edge cases", () => {
  it("starter dose at 0-3 months omni produces low-or-moderate overall (fiber pushes it up)", () => {
    const profile = calculateDeficiencies(baseIntake);
    expect(profile.overallScore).toBeLessThan(60);
  });

  it("12+ months high dose vegan with all symptoms drives high tier", () => {
    const profile = calculateDeficiencies({
      ...baseIntake,
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

  it("dailyProteinTargetG is included in the profile output", () => {
    const profile = calculateDeficiencies(baseIntake);
    expect(profile.dailyProteinTargetG).toBeGreaterThan(0);
  });
});

describe("supplement-data — SAFETY: potassium is food-only", () => {
  it("returns potassium recommendation as foodOnly for every profile", () => {
    for (const drug of drugs) {
      for (const duration of durations) {
        for (const dose of doses) {
          for (const diet of diets) {
            const intake: IntakeData = {
              ...baseIntake,
              drug,
              duration,
              dose,
              diet,
              symptoms,
            };
            const profile = calculateDeficiencies(intake);
            const recs = getSupplementRecommendations(profile, intake);
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
    const intake: IntakeData = {
      ...baseIntake,
      drug: "tirz",
      duration: "12+",
      dose: "high",
      diet: "vegan",
      symptoms: ["fatigue", "muscle"],
    };
    const profile = calculateDeficiencies(intake);
    const recs = getSupplementRecommendations(profile, intake);
    for (const r of recs) {
      if (r.deficiencyKey !== "potassium") {
        expect(r.foodOnly).toBeFalsy();
      }
    }
  });
});

describe("supplement-data — quantitative targets", () => {
  it("returns protein daily target matching profile.dailyProteinTargetG", () => {
    const intake: IntakeData = {
      ...baseIntake,
      duration: "6-12",
      dose: "moderate",
      symptoms: ["muscle"],
    };
    const profile = calculateDeficiencies(intake);
    const recs = getSupplementRecommendations(profile, intake);
    const protein = recs.find((r) => r.deficiencyKey === "protein");
    expect(protein?.dailyTargetAmount).toContain(
      `${profile.dailyProteinTargetG} g/day`,
    );
  });

  it("iron target is 18 mg for pre-menopausal women, 8 mg otherwise", () => {
    const female: IntakeData = {
      ...baseIntake,
      sex: "female",
      ageRange: "35-49",
      duration: "12+",
      dose: "high",
      symptoms: ["fatigue", "hairloss"],
    };
    const male: IntakeData = {
      ...baseIntake,
      sex: "male",
      ageRange: "35-49",
      duration: "12+",
      dose: "high",
      symptoms: ["fatigue", "hairloss"],
    };
    const fp = calculateDeficiencies(female);
    const mp = calculateDeficiencies(male);
    const femaleIron = getSupplementRecommendations(fp, female).find(
      (r) => r.deficiencyKey === "iron",
    );
    const maleIron = getSupplementRecommendations(mp, male).find(
      (r) => r.deficiencyKey === "iron",
    );
    expect(femaleIron?.dailyTargetAmount).toContain("18 mg");
    expect(maleIron?.dailyTargetAmount).toContain("8 mg");
  });
});

describe("supplement-data — priority + threshold logic", () => {
  it("returns critical priority once protein score >= 65", () => {
    const intake: IntakeData = {
      ...baseIntake,
      drug: "tirz",
      duration: "12+",
      dose: "high",
      diet: "omni",
      symptoms: ["muscle", "hairloss"],
    };
    const profile = calculateDeficiencies(intake);
    const recs = getSupplementRecommendations(profile, intake);
    const protein = recs.find((r) => r.deficiencyKey === "protein");
    expect(protein?.priority).toBe("critical");
  });

  it("sorts critical → high → support", () => {
    const intake: IntakeData = {
      ...baseIntake,
      drug: "tirz",
      duration: "12+",
      dose: "high",
      diet: "vegan",
      symptoms: ["fatigue", "hairloss", "muscle", "brainfog"],
    };
    const profile = calculateDeficiencies(intake);
    const recs = getSupplementRecommendations(profile, intake);
    const rank = { critical: 0, high: 1, support: 2 } as const;
    for (let i = 1; i < recs.length; i++) {
      expect(rank[recs[i].priority]).toBeGreaterThanOrEqual(
        rank[recs[i - 1].priority],
      );
    }
  });

  it("low-risk profile still returns at least potassium food-only", () => {
    const profile = calculateDeficiencies(baseIntake);
    const recs = getSupplementRecommendations(profile, baseIntake);
    expect(recs.length).toBeGreaterThanOrEqual(1);
    expect(recs.some((r) => r.deficiencyKey === "potassium")).toBe(true);
  });

  it("includes fiber recommendation when score >= threshold", () => {
    const intake: IntakeData = {
      ...baseIntake,
      duration: "6-12",
      dose: "moderate",
      symptoms: ["constipation"],
    };
    const profile = calculateDeficiencies(intake);
    const recs = getSupplementRecommendations(profile, intake);
    const fiber = recs.find((r) => r.deficiencyKey === "fiber");
    expect(fiber).toBeDefined();
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

describe("injection-cycle — phase mapping", () => {
  it("days 0-1 are peak", () => {
    expect(getCyclePhase(0)).toBe("peak");
    expect(getCyclePhase(1)).toBe("peak");
  });

  it("days 2-4 are plateau", () => {
    expect(getCyclePhase(2)).toBe("plateau");
    expect(getCyclePhase(3)).toBe("plateau");
    expect(getCyclePhase(4)).toBe("plateau");
  });

  it("days 5-6 are trough", () => {
    expect(getCyclePhase(5)).toBe("trough");
    expect(getCyclePhase(6)).toBe("trough");
  });

  it("getCycleAdvice returns peak guidance on injection day", () => {
    const profile = calculateDeficiencies(baseIntake);
    // Mon = injection day; pick a Monday to evaluate.
    const monday = new Date("2026-05-18T10:00:00Z"); // 2026-05-18 is a Monday
    const advice = getCycleAdvice("mon", "morning", profile, monday);
    expect(advice.phase).toBe("peak");
    expect(advice.actions.some((a) => a.toLowerCase().includes("liquid"))).toBe(
      true,
    );
  });
});

describe("gi-protocol", () => {
  it("inactive when no nausea or constipation", () => {
    const protocol = getGIProtocol(["fatigue", "hairloss"]);
    expect(protocol.active).toBe(false);
    expect(protocol.priorityRecommendations).toHaveLength(0);
  });

  it("activates and pauses iron when nausea is present", () => {
    const protocol = getGIProtocol(["nausea"]);
    expect(protocol.active).toBe(true);
    expect(protocol.pauseSupplements).toContain("iron");
    expect(protocol.proteinForm).toBe("liquid-only");
  });

  it("recommends resistant dextrin fiber when constipation is present", () => {
    const protocol = getGIProtocol(["constipation"]);
    expect(protocol.active).toBe(true);
    expect(
      protocol.priorityRecommendations.some((r) =>
        r.toLowerCase().includes("resistant dextrin"),
      ),
    ).toBe(true);
  });

  it("flips thiamineUrgent when vomiting is present", () => {
    const protocol = getGIProtocol(["vomiting"]);
    expect(protocol.active).toBe(true);
    expect(protocol.thiamineUrgent).toBe(true);
    expect(protocol.proteinForm).toBe("liquid-only");
    expect(protocol.pauseSupplements).toContain("iron");
  });

  it("does not set thiamineUrgent without vomiting", () => {
    expect(getGIProtocol(["nausea"]).thiamineUrgent).toBe(false);
    expect(getGIProtocol(["constipation"]).thiamineUrgent).toBe(false);
    expect(getGIProtocol(["none"]).thiamineUrgent).toBe(false);
  });
});

describe("calculateDeficiencies — thiamine acute risk", () => {
  it("is 0 when no GI symptoms are present", () => {
    const profile = calculateDeficiencies(baseIntake);
    expect(profile.thiamine).toBe(0);
  });

  it("does not grow with duration or dose alone", () => {
    const longHigh = calculateDeficiencies({
      ...baseIntake,
      duration: "12+",
      dose: "high",
    });
    expect(longHigh.thiamine).toBe(0);
  });

  it("floors at 70 when nausea is reported", () => {
    const profile = calculateDeficiencies({
      ...baseIntake,
      symptoms: ["nausea"],
    });
    expect(profile.thiamine).toBeGreaterThanOrEqual(70);
  });

  it("floors at 95 when vomiting is reported", () => {
    const profile = calculateDeficiencies({
      ...baseIntake,
      symptoms: ["vomiting"],
    });
    expect(profile.thiamine).toBeGreaterThanOrEqual(95);
  });

  it("vomiting wins over nausea when both present", () => {
    const profile = calculateDeficiencies({
      ...baseIntake,
      symptoms: ["nausea", "vomiting"],
    });
    expect(profile.thiamine).toBeGreaterThanOrEqual(95);
  });

  it("is excluded from the overallScore average", () => {
    // Two intakes with identical chronic deficiencies but one with vomiting:
    // overallScore should be the same (or very close — within rounding) because
    // thiamine is excluded from the average.
    const a = calculateDeficiencies(baseIntake);
    const b = calculateDeficiencies({ ...baseIntake, symptoms: ["vomiting"] });
    // Vomiting also adds K +25, mg +18, b12 +10 — those *do* count. So the
    // overall will rise from those, but if we subtract the thiamine effect
    // by hand, the difference should match the sum of (K + mg + b12) / 9.
    const thiamineExcludedDelta = b.overallScore - a.overallScore;
    expect(thiamineExcludedDelta).toBeLessThan(10);
  });
});

describe("supplement-data — thiamine entry", () => {
  it("is not returned when no GI symptoms are present", () => {
    const profile = calculateDeficiencies(baseIntake);
    const recs = getSupplementRecommendations(profile, baseIntake);
    expect(recs.find((r) => r.deficiencyKey === "thiamine")).toBeUndefined();
  });

  it("is returned at 'high' priority with nausea alone", () => {
    const intake: IntakeData = { ...baseIntake, symptoms: ["nausea"] };
    const profile = calculateDeficiencies(intake);
    const recs = getSupplementRecommendations(profile, intake);
    const thiamine = recs.find((r) => r.deficiencyKey === "thiamine");
    expect(thiamine).toBeDefined();
    expect(thiamine?.priority).toBe("high");
  });

  it("is returned at 'critical' priority when vomiting is present", () => {
    const intake: IntakeData = { ...baseIntake, symptoms: ["vomiting"] };
    const profile = calculateDeficiencies(intake);
    const recs = getSupplementRecommendations(profile, intake);
    const thiamine = recs.find((r) => r.deficiencyKey === "thiamine");
    expect(thiamine).toBeDefined();
    expect(thiamine?.priority).toBe("critical");
  });
});

describe("safety-alerts", () => {
  it("warns against thermogenics when fatigue is reported", () => {
    const alerts = getSafetyAlerts({ ...baseIntake, symptoms: ["fatigue"] });
    expect(alerts.some((a) => a.id === "no-thermogenics")).toBe(true);
  });

  it("flags calcium/iron stacking as a baseline info alert", () => {
    const alerts = getSafetyAlerts(baseIntake);
    expect(alerts.some((a) => a.id === "no-stacked-calcium-iron")).toBe(true);
  });

  it("calcium info alert disclosures the 1,200 mg/day cap", () => {
    const alerts = getSafetyAlerts(baseIntake);
    const calcium = alerts.find((a) => a.id === "no-stacked-calcium-iron");
    expect(calcium?.body).toContain("1,200 mg");
  });

  it("triggers bone-health alert for post-menopausal female on 12+ months", () => {
    const intake: IntakeData = {
      ...baseIntake,
      sex: "female",
      ageRange: "50-64",
      duration: "12+",
    };
    const alerts = getSafetyAlerts(intake);
    expect(alerts.some((a) => a.id === "bone-health")).toBe(true);
  });

  it("does not trigger bone-health alert for pre-menopausal users", () => {
    const intake: IntakeData = {
      ...baseIntake,
      sex: "female",
      ageRange: "35-49",
      duration: "12+",
    };
    const alerts = getSafetyAlerts(intake);
    expect(alerts.some((a) => a.id === "bone-health")).toBe(false);
  });

  it("does not trigger bone-health alert for short-duration users", () => {
    const intake: IntakeData = {
      ...baseIntake,
      sex: "female",
      ageRange: "65+",
      duration: "0-3",
    };
    const alerts = getSafetyAlerts(intake);
    expect(alerts.some((a) => a.id === "bone-health")).toBe(false);
  });
});

void sexes;
void ages;
void activities;
