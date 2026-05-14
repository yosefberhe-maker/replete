import type {
  Diet,
  Dose,
  Drug,
  Duration,
  IntakeData,
  Symptom,
} from "@/types";

export type StepKey = keyof IntakeData;

export interface StepOption<T extends string> {
  value: T;
  title: string;
  subtitle?: string;
  badge?: string;
}

export type StepConfig =
  | {
      key: "drug";
      title: string;
      subtitle: string;
      type: "single";
      options: StepOption<Drug>[];
    }
  | {
      key: "duration";
      title: string;
      subtitle: string;
      type: "single";
      options: StepOption<Duration>[];
    }
  | {
      key: "dose";
      title: string;
      subtitle: string;
      type: "single";
      options: StepOption<Dose>[];
    }
  | {
      key: "diet";
      title: string;
      subtitle: string;
      type: "single";
      options: StepOption<Diet>[];
    }
  | {
      key: "symptoms";
      title: string;
      subtitle: string;
      type: "multi";
      options: StepOption<Symptom>[];
    };

export const STEPS: StepConfig[] = [
  {
    key: "drug",
    title: "Which GLP-1 are you on?",
    subtitle: "Different drugs suppress appetite differently. We adjust accordingly.",
    type: "single",
    options: [
      {
        value: "sema",
        title: "Semaglutide",
        subtitle: "Ozempic · Wegovy · Rybelsus",
        badge: "Most common",
      },
      {
        value: "tirz",
        title: "Tirzepatide",
        subtitle: "Mounjaro · Zepbound",
        badge: "Dual agonist",
      },
      {
        value: "other",
        title: "Other / Not sure",
        subtitle: "Liraglutide · Dulaglutide · Compounded",
      },
    ],
  },
  {
    key: "duration",
    title: "How long have you been on it?",
    subtitle: "Deficiencies compound the longer your intake stays reduced.",
    type: "single",
    options: [
      {
        value: "0-3",
        title: "Less than 3 months",
        subtitle: "Early stage — mostly side-effect management",
      },
      {
        value: "3-6",
        title: "3 to 6 months",
        subtitle: "Deficiencies starting to develop",
      },
      {
        value: "6-12",
        title: "6 to 12 months",
        subtitle: "Compounding nutrient gaps — critical window",
      },
      {
        value: "12+",
        title: "Over a year",
        subtitle: "High risk of established deficiencies",
      },
    ],
  },
  {
    key: "dose",
    title: "What's your current dose?",
    subtitle: "Higher doses suppress appetite more — and increase the nutrient deficit.",
    type: "single",
    options: [
      {
        value: "starter",
        title: "Starter / titrating up",
        subtitle: "0.25–0.5 mg semaglutide · 2.5–5 mg tirzepatide",
      },
      {
        value: "moderate",
        title: "Moderate maintenance",
        subtitle: "1–1.7 mg semaglutide · 10–12.5 mg tirzepatide",
      },
      {
        value: "high",
        title: "Full / high dose",
        subtitle: "2–2.4 mg semaglutide · 15 mg tirzepatide",
      },
    ],
  },
  {
    key: "diet",
    title: "How do you eat?",
    subtitle: "Diet pattern shifts which nutrients you're most likely missing.",
    type: "single",
    options: [
      { value: "omni", title: "Omnivore", subtitle: "Meat, fish, dairy, plants" },
      { value: "veg", title: "Vegetarian", subtitle: "No meat or fish" },
      {
        value: "vegan",
        title: "Vegan / Plant-based",
        subtitle: "No animal products",
      },
      {
        value: "keto",
        title: "Keto / Low-carb",
        subtitle: "Carbs typically under 50 g/day",
      },
    ],
  },
  {
    key: "symptoms",
    title: "Any symptoms you've noticed?",
    subtitle: "Select all that apply. We use these as direct diagnostic signals.",
    type: "multi",
    options: [
      {
        value: "fatigue",
        title: "Fatigue or low energy",
        subtitle: "Often points to iron, B12, or vitamin D",
      },
      {
        value: "hairloss",
        title: "Hair thinning or loss",
        subtitle: "Strongly correlates with zinc and iron",
      },
      {
        value: "muscle",
        title: "Muscle weakness or loss",
        subtitle: "Most common GLP-1 long-term issue",
      },
      {
        value: "brainfog",
        title: "Brain fog or poor focus",
        subtitle: "Often choline and B12",
      },
      {
        value: "nausea",
        title: "Nausea or GI discomfort",
        subtitle: "Electrolyte signal — magnesium, potassium",
      },
      {
        value: "none",
        title: "None of these yet",
        subtitle: "You're being proactive. Good.",
      },
    ],
  },
];
