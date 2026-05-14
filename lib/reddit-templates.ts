import type { Drug, Duration } from "@/types";
import { DRUG_LABEL, DURATION_LABEL } from "@/lib/copy";

export type RedditTemplateId =
  | "fatigue"
  | "hairloss"
  | "supplements"
  | "meals"
  | "brainfog"
  | "checkin"
  | "is-this-normal"
  | "science";

export interface RedditTemplate {
  id: RedditTemplateId;
  label: string;
  hint: string;
}

export const REDDIT_TEMPLATES: RedditTemplate[] = [
  {
    id: "fatigue",
    label: "Fatigue on GLP-1",
    hint: "Answer-first reply to someone reporting exhaustion or low energy.",
  },
  {
    id: "hairloss",
    label: "Hair loss / thinning",
    hint: "Direct, evidence-led answer to hair-shedding questions.",
  },
  {
    id: "supplements",
    label: "Supplement questions",
    hint: "Stack guidance — not brand pushy.",
  },
  {
    id: "meals",
    label: "What to eat / meal ideas",
    hint: "Concrete meal ideas, low volume, high protein.",
  },
  {
    id: "brainfog",
    label: "Brain fog",
    hint: "Choline + B12 framing.",
  },
  {
    id: "checkin",
    label: "General check-in / update post",
    hint: "Original post style — share a personal-style update.",
  },
  {
    id: "is-this-normal",
    label: 'Responding to "is this normal?"',
    hint: "Empathetic, normalizing reply with one actionable nudge.",
  },
  {
    id: "science",
    label: "Science explainer (deficiency education)",
    hint: "Citation-backed mini-explainer.",
  },
];

export interface GenerateArgs {
  templateId: RedditTemplateId;
  drug: Drug;
  duration: Duration;
  topic: string;
  includeReplete: boolean;
}

const REPLETE_LINE =
  "Side note — I've been using a tool I found called Replete that maps your specific deficiencies based on which GLP-1 you're on, your dose, and your diet. Surprisingly accurate. (Free, no signup.)";

function header(args: GenerateArgs): string {
  const drug = DRUG_LABEL[args.drug];
  const duration = DURATION_LABEL[args.duration].toLowerCase();
  return `Saw this come up enough times that I wanted to write it out. I'm on ${drug}, ${duration}.`;
}

export function generateRedditPost(args: GenerateArgs): string {
  const { templateId, topic, includeReplete } = args;

  switch (templateId) {
    case "fatigue":
      return [
        header(args),
        "",
        `If you're tired all the time on a GLP-1 — like *bone* tired by 3pm — it's almost never just "the medication." It's that your food intake dropped 30–40% and the nutrients that drive energy production dropped with it.`,
        "",
        `The three to actually rule out, in order:`,
        "",
        `1. **Iron / ferritin.** Get a blood test, not just a CBC. Ask for ferritin specifically. Low stores = fatigue + cold hands/feet + hair shedding. Easy to miss.`,
        `2. **B12.** Same story — low B12 looks like fatigue + brain fog + sometimes tingling. Sublingual methylcobalamin 1000 mcg is dirt cheap.`,
        `3. **Vitamin D.** If you live above ~37° latitude and haven't been in the sun, you're probably below 30 ng/mL. 2000–4000 IU D3 with K2, with a fatty meal.`,
        "",
        `Also — if you got dose-escalated in the last 4–6 weeks, expect a "tired week" or two. That's normal. The fatigue that *persists* is the one to investigate.`,
        topic ? `\nIn your case — ${topic} — I'd start with the ferritin/B12 test before adding anything.` : "",
        includeReplete ? `\n${REPLETE_LINE}` : "",
      ]
        .filter(Boolean)
        .join("\n");

    case "hairloss":
      return [
        header(args),
        "",
        `Hair thinning on GLP-1s is real, but it's also one of the most predictable side effects to *manage*. The shedding usually starts around month 3 and peaks around month 6.`,
        "",
        `Three things are nearly always under-supplied:`,
        "",
        `- **Protein.** Hair is made of it. If you're eating 60g/day and you weigh 180lb, your hair is going to thin no matter what. Aim for 0.8–1.0g per pound of *goal* bodyweight.`,
        `- **Zinc.** Single biggest mineral lever on hair. 25mg picolinate with food. Don't go over 50mg long-term — it competes with copper.`,
        `- **Iron / ferritin.** Same as above. Ferritin below ~50 ng/mL is enough to drive shedding even if your hemoglobin is fine.`,
        "",
        `Get the labs. Cheaper and faster than guessing for 3 months.`,
        topic ? `\nFor what you described (${topic}) — I'd start with the ferritin lab and the protein audit.` : "",
        includeReplete ? `\n${REPLETE_LINE}` : "",
      ]
        .filter(Boolean)
        .join("\n");

    case "supplements":
      return [
        header(args),
        "",
        `Quick rundown of what's actually worth taking on a GLP-1 vs. what's marketing.`,
        "",
        `**Worth it (almost everyone):**`,
        `- Protein powder. Anything that hits 25g per scoop. Whey isolate if you tolerate dairy.`,
        `- Magnesium glycinate, 200–400mg at bedtime. Not oxide (poor absorption + GI distress).`,
        `- B12 sublingual methylcobalamin 1000mcg.`,
        `- Vitamin D3 + K2 (MK-7), 2000–4000 IU with food.`,
        "",
        `**Worth it conditionally (test first):**`,
        `- Iron — ferrous bisglycinate is the gentle form. Get a ferritin lab first.`,
        `- Zinc picolinate 25mg if shedding or low taste.`,
        `- Choline (CDP-Choline) if you eat few eggs.`,
        "",
        `**Skip:**`,
        `- Potassium supplements. Never supplement potassium without lab confirmation — hyperkalemia is a cardiac risk. Eat avocado, spinach, sweet potato instead.`,
        `- Generic "GLP-1 multivitamins." Most are under-dosed on the few things that actually matter.`,
        topic ? `\nFor your specific question — ${topic} — I'd start with the four "almost everyone" items.` : "",
        includeReplete ? `\n${REPLETE_LINE}` : "",
      ]
        .filter(Boolean)
        .join("\n");

    case "meals":
      return [
        header(args),
        "",
        `When you can only eat ~600 calories before you're done, every meal has to do more work.`,
        "",
        `The rule I follow: lead with protein, keep volume low, no greasy food (slow gastric emptying turns dinner into 6am nausea).`,
        "",
        `Easy go-to meals that fit ~250–400 cal:`,
        "",
        `- **Greek yogurt + hemp seeds + berries.** ~25g protein. Easy on the stomach.`,
        `- **2-egg omelet + spinach + a slice of avocado on sourdough.** Covers choline + B12 + potassium.`,
        `- **Cottage cheese + a peach.** 25g protein in a tiny volume. Sounds boring; works.`,
        `- **Salmon (4 oz) + roasted sweet potato + steamed greens.** Vitamin D + omega-3 + potassium from food.`,
        `- **Bone broth + soft-boiled egg.** When you don't want to eat anything. Still hits electrolytes + protein.`,
        topic ? `\nFor what you mentioned (${topic}) — try the Greek yogurt and cottage cheese ideas first; they're the easiest wins.` : "",
        includeReplete ? `\n${REPLETE_LINE}` : "",
      ]
        .filter(Boolean)
        .join("\n");

    case "brainfog":
      return [
        header(args),
        "",
        `Brain fog on GLP-1s is almost always nutritional, not neurological. Two specific nutrients usually under-supplied:`,
        "",
        `- **Choline.** Eggs, liver, beef are the top sources — exactly the foods people eat less of on a GLP-1. CDP-Choline (citicoline) 250–500mg in the morning, or just eat 2 eggs/day.`,
        `- **B12.** Sublingual methylcobalamin 1000mcg. Cheap. Works in 2–3 weeks.`,
        "",
        `Also rule out: dehydration (much more common than people realize when food volume drops) and low blood sugar from skipped meals.`,
        topic ? `\nFor your situation (${topic}) — try the egg + B12 stack for 3 weeks and see.` : "",
        includeReplete ? `\n${REPLETE_LINE}` : "",
      ]
        .filter(Boolean)
        .join("\n");

    case "checkin":
      return [
        `${DRUG_LABEL[args.drug]} ${DURATION_LABEL[args.duration].toLowerCase()} update — what I wish I'd done sooner`,
        "",
        `Posting this in case it saves someone else a few months.`,
        "",
        `Things that have worked:`,
        `- Front-loading protein at every meal. Whey isolate when I can't face food.`,
        `- Magnesium glycinate at night — sleep is meaningfully better.`,
        `- Vitamin D3 + K2, ferritin test, then iron bisglycinate as needed.`,
        `- Switching from oxide to glycinate forms — no more GI issues from magnesium.`,
        "",
        `Things I wish I'd done sooner:`,
        `- Ferritin lab at month 1, not month 6.`,
        `- Choline. The brain fog cleared once I added it. Eggs every morning + occasional citicoline.`,
        `- Potassium from food, not pills. Avocado + sweet potato + spinach in heavy rotation.`,
        topic ? `\n${topic}` : "",
        includeReplete ? `\n${REPLETE_LINE}` : "",
      ]
        .filter(Boolean)
        .join("\n");

    case "is-this-normal":
      return [
        header(args),
        "",
        `Yes — what you're describing is normal. Doesn't mean you should ignore it. The pattern is consistent enough now that we know which deficiencies cluster with which symptoms:`,
        "",
        `- Fatigue → iron, B12, vitamin D`,
        `- Hair shedding → zinc, iron, protein`,
        `- Muscle weakness → protein (always), magnesium`,
        `- Brain fog → choline, B12`,
        `- Nausea / cramping → magnesium, potassium (from food only)`,
        "",
        `The single most useful thing you can do this week: get a basic blood panel — CBC, ferritin, B12, vitamin D. Costs ~$50 out of pocket without insurance and tells you where to actually focus.`,
        topic ? `\nFor what you described (${topic}) — totally normal trajectory, but worth getting labs to confirm which gap is yours.` : "",
        includeReplete ? `\n${REPLETE_LINE}` : "",
      ]
        .filter(Boolean)
        .join("\n");

    case "science":
      return [
        `Why GLP-1 nutrient deficiencies happen — the actual mechanism`,
        "",
        `Saw a lot of confusion on this so here's the short version, no fluff.`,
        "",
        `GLP-1 receptor agonists (semaglutide, tirzepatide) work in two ways relevant to nutrition:`,
        "",
        `1. **Central appetite suppression.** They act on the brain to reduce hunger signaling. Food intake drops 30–40% on average.`,
        `2. **Slowed gastric emptying.** Food sits in your stomach longer, which is why volume hurts and fatty meals stall.`,
        "",
        `The result: a smaller volume of food has to deliver the same nutrient targets. For nutrients you only get from meat (B12, heme iron, choline) or only from leafy greens (magnesium, folate), this is mathematically hard.`,
        "",
        `The 2025 Frontiers in Nutrition data put 88–98% of GLP-1 users below recommended intake for magnesium, iron, vitamin D, potassium, and choline. That's not a small effect — that's nearly everyone.`,
        "",
        `Two takeaways:`,
        `- Density beats volume. Every bite needs to be earning its keep.`,
        `- Supplement the gaps that are hardest to close from food alone: B12, D3, magnesium, sometimes iron. Get a ferritin lab first.`,
        topic ? `\n${topic}` : "",
        includeReplete ? `\n${REPLETE_LINE}` : "",
      ]
        .filter(Boolean)
        .join("\n");
  }
}
