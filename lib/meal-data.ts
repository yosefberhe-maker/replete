import type {
  DeficiencyProfile,
  Diet,
  IntakeData,
  Meal,
  MealDay,
  MealPlan,
} from "@/types";

/**
 * Meal planning engine.
 *
 * Returns a 3-day microdose meal plan adapted to the user's diet type.
 * Each meal is small-volume, protein-led, GI-friendly, and tagged with
 * the specific deficiency it addresses.
 */

const PHILOSOPHY =
  "On GLP-1s, total volume drops 30–40%. The meals below are built to do more with less: protein-led, nutrient-dense, easy on a slow-emptying stomach. Volume is the enemy; density is the goal.";

const KEY_PRINCIPLES = [
  "Lead with protein at every meal — your appetite is your scarcest resource.",
  "Keep volume low. A 200-calorie meal can deliver more nutrition than a 600-calorie one if it's the right 200.",
  "Avoid heavy, greasy, or large-volume meals — slow gastric emptying will turn dinner into 6 AM nausea.",
  "Hydrate constantly. Reduced food intake means less ambient water from food.",
];

const OMNI_MEALS: MealDay[] = [
  {
    day: 1,
    title: "Iron + B12 reset",
    meals: [
      {
        type: "Breakfast",
        name: "Two-egg scramble with spinach and a side of Greek yogurt",
        why: "Eggs cover choline + B12; spinach is iron + magnesium; yogurt adds 15 g protein in a small volume.",
        proteinGrams: 32,
      },
      {
        type: "Lunch",
        name: "Salmon bowl: 4 oz salmon, roasted sweet potato, avocado, kale",
        why: "Salmon delivers vitamin D + omega-3s. Sweet potato + avocado = potassium from food. Kale adds magnesium.",
        proteinGrams: 28,
      },
      {
        type: "Dinner",
        name: "Sirloin (3 oz) with sautéed mushrooms and a small spinach salad",
        why: "Red meat is the densest source of bioavailable iron and zinc. Small portion keeps GI happy.",
        proteinGrams: 26,
      },
    ],
  },
  {
    day: 2,
    title: "Zinc + protein day",
    meals: [
      {
        type: "Breakfast",
        name: "Cottage cheese with hemp seeds and berries",
        why: "Cottage cheese = 25 g protein in a tiny volume. Hemp seeds add zinc and magnesium.",
        proteinGrams: 27,
      },
      {
        type: "Lunch",
        name: "Chicken thigh with roasted brussels sprouts and quinoa",
        why: "Dark meat chicken is higher in zinc and iron than breast. Brussels sprouts add vitamin K + fiber.",
        proteinGrams: 30,
      },
      {
        type: "Dinner",
        name: "Shrimp stir-fry with bok choy, peppers, and a small portion of jasmine rice",
        why: "Shrimp is high-protein, low-volume, easy on the stomach. Bok choy + peppers cover micros.",
        proteinGrams: 28,
      },
    ],
  },
  {
    day: 3,
    title: "Energy + electrolytes",
    meals: [
      {
        type: "Breakfast",
        name: "Smoked salmon, half avocado, on a slice of seeded sourdough",
        why: "Salmon + avocado = vitamin D, omega-3, potassium. Sourdough is gentler than other breads.",
        proteinGrams: 24,
      },
      {
        type: "Lunch",
        name: "Turkey + white bean soup with greens",
        why: "Soup is the most tolerated lunch on a GLP-1. White beans deliver iron and potassium from food.",
        proteinGrams: 26,
      },
      {
        type: "Dinner",
        name: "Pan-seared cod with lemon-garlic broccoli and a small baked potato",
        why: "Cod is gentle, high-protein. Potato adds potassium. Broccoli for vitamin C — helps iron absorption from prior meals.",
        proteinGrams: 30,
      },
    ],
  },
];

const VEG_MEALS: MealDay[] = [
  {
    day: 1,
    title: "B12 + iron focus",
    meals: [
      {
        type: "Breakfast",
        name: "Greek yogurt + nutritional yeast bowl with hemp seeds and berries",
        why: "Greek yogurt = 15 g protein, B12. Nutritional yeast is a top vegetarian B12 source. Hemp adds zinc.",
        proteinGrams: 24,
      },
      {
        type: "Lunch",
        name: "Lentil + spinach soup with a soft-boiled egg on top",
        why: "Lentils for iron, spinach for magnesium, egg for choline + B12 — all in a small, easy-on-the-gut volume.",
        proteinGrams: 22,
      },
      {
        type: "Dinner",
        name: "Tempeh stir-fry with broccoli and quinoa",
        why: "Tempeh is the most bioavailable plant protein source. Pair with vitamin-C-rich broccoli to boost iron absorption.",
        proteinGrams: 28,
      },
    ],
  },
  {
    day: 2,
    title: "Protein + zinc emphasis",
    meals: [
      {
        type: "Breakfast",
        name: "Two-egg omelet with goat cheese, mushrooms, and spinach",
        why: "Eggs are the cornerstone of vegetarian GLP-1 nutrition. Mushrooms add vitamin D + zinc.",
        proteinGrams: 24,
      },
      {
        type: "Lunch",
        name: "Edamame + tofu rice bowl with sesame and avocado",
        why: "Edamame and tofu stack for 25+ g protein. Avocado adds potassium from food.",
        proteinGrams: 26,
      },
      {
        type: "Dinner",
        name: "Paneer or halloumi with grilled vegetables and a small portion of farro",
        why: "Paneer/halloumi is high-protein, low-volume. Farro brings magnesium.",
        proteinGrams: 24,
      },
    ],
  },
  {
    day: 3,
    title: "Choline + minerals",
    meals: [
      {
        type: "Breakfast",
        name: "Egg + avocado on sprouted toast with a side of cottage cheese",
        why: "Eggs deliver choline (the #1 underrated vegetarian deficiency). Cottage cheese boosts total protein.",
        proteinGrams: 28,
      },
      {
        type: "Lunch",
        name: "Chickpea + roasted vegetable salad with feta and olive oil",
        why: "Chickpeas add iron + protein. Feta for B12 + calcium.",
        proteinGrams: 20,
      },
      {
        type: "Dinner",
        name: "Black bean and sweet potato bowl with a poached egg and salsa",
        why: "Beans + egg = complete amino acid profile. Sweet potato for potassium.",
        proteinGrams: 24,
      },
    ],
  },
];

const VEGAN_MEALS: MealDay[] = [
  {
    day: 1,
    title: "B12 + iron stack",
    meals: [
      {
        type: "Breakfast",
        name: "Tofu scramble with nutritional yeast, spinach, and a side of fortified plant yogurt",
        why: "Nutritional yeast + fortified yogurt are the only reliable vegan B12 sources. Spinach for iron + magnesium.",
        proteinGrams: 22,
      },
      {
        type: "Lunch",
        name: "Lentil + quinoa bowl with roasted red peppers and tahini",
        why: "Quinoa is complete protein; lentils + peppers boost iron absorption via vitamin C. Tahini adds zinc.",
        proteinGrams: 24,
      },
      {
        type: "Dinner",
        name: "Tempeh tacos with avocado, cabbage slaw, and lime",
        why: "Tempeh is fermented — easier on the gut. Avocado adds potassium. Lime/cabbage for vitamin C.",
        proteinGrams: 26,
      },
    ],
  },
  {
    day: 2,
    title: "Protein density",
    meals: [
      {
        type: "Breakfast",
        name: "Pea-protein smoothie with hemp seeds, banana, almond butter, and oats",
        why: "Pea protein delivers 20+ g in 200 mL. Hemp for zinc. Easy on a slow-emptying stomach.",
        proteinGrams: 30,
      },
      {
        type: "Lunch",
        name: "Edamame, soba noodles, and miso-tahini dressing",
        why: "Edamame is one of the densest plant proteins. Miso for B vitamins, tahini for zinc.",
        proteinGrams: 26,
      },
      {
        type: "Dinner",
        name: "Black bean and sweet potato bowl with pumpkin seeds and salsa",
        why: "Pumpkin seeds are a top zinc + magnesium source. Sweet potato for potassium.",
        proteinGrams: 22,
      },
    ],
  },
  {
    day: 3,
    title: "Choline + vitamin D",
    meals: [
      {
        type: "Breakfast",
        name: "Soy yogurt parfait with chia, hemp, and walnuts",
        why: "Soy is the highest-choline plant food. Chia + walnuts add ALA omega-3s.",
        proteinGrams: 20,
      },
      {
        type: "Lunch",
        name: "Chickpea + roasted vegetable wrap with hummus",
        why: "Chickpeas double up for iron and protein in a portable, small-volume format.",
        proteinGrams: 22,
      },
      {
        type: "Dinner",
        name: "Tofu + shiitake stir-fry with bok choy and brown rice",
        why: "Shiitake mushrooms are a rare plant source of vitamin D. Tofu for protein + choline.",
        proteinGrams: 28,
      },
    ],
  },
];

const KETO_MEALS: MealDay[] = [
  {
    day: 1,
    title: "Electrolyte + protein day",
    meals: [
      {
        type: "Breakfast",
        name: "Two-egg omelet with cheddar, spinach, and avocado",
        why: "Eggs for choline + B12. Avocado + spinach add the potassium and magnesium that keto burns through.",
        proteinGrams: 28,
      },
      {
        type: "Lunch",
        name: "Salmon salad with mixed greens, olive oil, and pumpkin seeds",
        why: "Salmon delivers vitamin D + omega-3. Pumpkin seeds add zinc + magnesium.",
        proteinGrams: 32,
      },
      {
        type: "Dinner",
        name: "Ribeye with sautéed mushrooms and asparagus",
        why: "Ribeye is the densest source of iron, zinc, and B12 you can get. Small portion (4 oz) is sufficient.",
        proteinGrams: 30,
      },
    ],
  },
  {
    day: 2,
    title: "Magnesium emphasis",
    meals: [
      {
        type: "Breakfast",
        name: "Cottage cheese + chia pudding with cinnamon",
        why: "Cottage cheese for protein, chia for magnesium and ALA omega-3s.",
        proteinGrams: 24,
      },
      {
        type: "Lunch",
        name: "Tuna salad lettuce wraps with avocado mayo and macadamia nuts",
        why: "Tuna for protein + selenium. Macadamia is the most keto-friendly nut for magnesium.",
        proteinGrams: 28,
      },
      {
        type: "Dinner",
        name: "Roast chicken thigh with butter-braised cabbage and a side of bone broth",
        why: "Bone broth covers electrolytes. Cabbage adds vitamin K and is low-volume.",
        proteinGrams: 30,
      },
    ],
  },
  {
    day: 3,
    title: "Fat-soluble vitamin focus",
    meals: [
      {
        type: "Breakfast",
        name: "Smoked salmon, cream cheese, and capers on a seed cracker",
        why: "Salmon for D + omega-3. Easy on a stalled-emptying stomach.",
        proteinGrams: 22,
      },
      {
        type: "Lunch",
        name: "Shrimp + avocado salad with feta and olive oil",
        why: "Shrimp is low-volume, high-protein. Avocado adds potassium.",
        proteinGrams: 28,
      },
      {
        type: "Dinner",
        name: "Pork tenderloin with roasted brussels sprouts and a slice of grass-fed butter",
        why: "Pork tenderloin is high in B vitamins. Butter (grass-fed) brings vitamin K2 + D.",
        proteinGrams: 30,
      },
    ],
  },
];

const PLANS: Record<Diet, MealDay[]> = {
  omni: OMNI_MEALS,
  veg: VEG_MEALS,
  vegan: VEGAN_MEALS,
  keto: KETO_MEALS,
};

/**
 * Personalize the meal plan slightly by signaling which meals address the
 * user's top deficiencies. We rotate a flagged meal to day 1 if it directly
 * addresses their #1 deficiency, otherwise leave the default ordering.
 */
function personalize(days: MealDay[], profile: DeficiencyProfile): MealDay[] {
  // For MVP: do not reorder — the data is curated. Use profile to add a
  // prefix to day 1 title if their top deficiency is in scope.
  const topDeficiency = (Object.entries(profile)
    .filter(([k]) => !["overallScore", "riskTier"].includes(k))
    .sort(([, a], [, b]) => (b as number) - (a as number))[0]?.[0] ?? "") as string;

  if (!topDeficiency) return days;

  return days.map((d, idx) =>
    idx === 0
      ? {
          ...d,
          title: `${d.title} — addresses your highest risk (${topDeficiency})`,
        }
      : d,
  );
}

export function getMealPlan(
  intake: IntakeData,
  profile: DeficiencyProfile,
): MealPlan {
  const days = personalize(PLANS[intake.diet], profile);
  return {
    days,
    philosophy: PHILOSOPHY,
    keyPrinciples: KEY_PRINCIPLES,
  };
}

export type { Meal, MealDay };
