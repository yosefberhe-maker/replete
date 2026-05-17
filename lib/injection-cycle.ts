import type {
  CycleAdvice,
  CyclePhase,
  DayOfWeek,
  DeficiencyProfile,
  InjectionTiming,
} from "@/types";

/**
 * Pharmacokinetic Synchronization (Gemini's framing).
 *
 * Once-weekly GLP-1 receptor agonists (semaglutide ~165 hr half-life,
 * tirzepatide ~120 hr half-life) produce a predictable serum-concentration
 * curve: appetite suppression and GI side effects peak 24–48 hr post-dose
 * and trough in the 24-48 hr before the next dose.
 *
 * Replete uses the injection day + timing to map today's calendar day to a
 * cycle phase, then shifts the food/supplement recommendation accordingly.
 * No other consumer GLP-1 app does this.
 */

const DAY_INDEX: Record<DayOfWeek, number> = {
  sun: 0,
  mon: 1,
  tue: 2,
  wed: 3,
  thu: 4,
  fri: 5,
  sat: 6,
};

export function daysSinceInjection(
  injectionDay: DayOfWeek,
  injectionTiming: InjectionTiming,
  now: Date = new Date(),
): number {
  const todayIdx = now.getDay();
  const injectionIdx = DAY_INDEX[injectionDay];
  let diff = todayIdx - injectionIdx;
  if (diff < 0) diff += 7;
  // If injection is in the evening and it's morning today on the same weekday,
  // we haven't completed a full day yet — but for phase mapping we treat
  // today as day 0 either way.
  void injectionTiming;
  return diff;
}

export function getCyclePhase(daysSince: number): CyclePhase {
  if (daysSince <= 1) return "peak";
  if (daysSince <= 4) return "plateau";
  return "trough";
}

export function getCycleAdvice(
  injectionDay: DayOfWeek,
  injectionTiming: InjectionTiming,
  profile: DeficiencyProfile,
  now: Date = new Date(),
): CycleAdvice {
  const dayOfCycle = daysSinceInjection(injectionDay, injectionTiming, now);
  const phase = getCyclePhase(dayOfCycle);

  if (phase === "peak") {
    const actions = [
      `Liquid protein only — whey isolate shake hits ${profile.dailyProteinTargetG} g target without volume.`,
      "Electrolytes: salted bone broth, electrolyte tab, or LMNT — sodium 1,500 mg + magnesium glycinate 200 mg.",
      "Small, frequent sips of water (250 mL every hour) — slow gastric emptying is at its strongest.",
    ];
    if (profile.iron >= 40) {
      actions.push("Skip iron today — most GI-irritating supplement during peak.");
    }
    return {
      phase,
      dayOfCycle,
      headline: "Peak suppression window — 24–48 hr post-injection",
      actions,
      avoid: [
        "Heavy or greasy meals (sit in the stomach, drive 6 AM nausea).",
        "Iron and zinc supplements on an empty stomach.",
        "High-osmolality fiber (inulin, large psyllium doses).",
      ],
    };
  }

  if (phase === "plateau") {
    return {
      phase,
      dayOfCycle,
      headline: "Plateau — gastric emptying normalizing",
      actions: [
        `Transition to whole-food protein (eggs, salmon, Greek yogurt) toward your ${profile.dailyProteinTargetG} g target.`,
        "Full supplement stack — magnesium, B12, D3+K2, zinc with food.",
        "Resume normal hydration cadence (2 L/day baseline).",
      ],
      avoid: [
        "Pushing food volume past comfort — your stomach is recovering, not back to baseline.",
      ],
    };
  }

  return {
    phase,
    dayOfCycle,
    headline: "Trough — appetite returning, pre-injection window",
    actions: [
      "Nutrient-dense whole foods — lead with protein, layer in greens, legumes, eggs.",
      "Best window for resistance training — appetite supports recovery calories.",
      "Iron and ferritin-supporting meals (red meat with vitamin C, lentils + bell pepper).",
    ],
    avoid: [
      "Overeating in compensation — the next peak will follow within 24 hr.",
    ],
  };
}
