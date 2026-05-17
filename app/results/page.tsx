"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import DeficiencyChart from "@/components/DeficiencyChart";
import SupplementStack from "@/components/SupplementStack";
import MealPlanView from "@/components/MealPlan";
import AnimatedNumber from "@/components/AnimatedNumber";
import WaitlistForm from "@/components/WaitlistForm";
import CyclePhaseCard from "@/components/CyclePhaseCard";
import GISupport from "@/components/GISupport";
import SafetyAlerts from "@/components/SafetyAlerts";
import ShareProfileButton from "@/components/ShareProfileButton";
import FindRD from "@/components/FindRD";
import Disclaimer from "@/components/Disclaimer";
import ReviewedBadge from "@/components/ReviewedBadge";
import { RepleteWordmark } from "@/components/RepleteWordmark";
import { DRUG_LABEL, DURATION_LABEL, DIET_LABEL, DOSE_LABEL } from "@/lib/copy";
import { getRiskLabel } from "@/lib/deficiency-engine";
import type {
  CompleteProfile,
  NutrientKey,
  RiskTier,
  SupplementRecommendation,
} from "@/types";

const STORAGE_KEY = "replete_profile";

const TIER_COLOR: Record<RiskTier, string> = {
  high: "text-red",
  moderate: "text-amber",
  low: "text-green",
};

const TIER_BADGE: Record<RiskTier, string> = {
  high: "bg-red/15 text-red border border-red/30",
  moderate: "bg-amber/15 text-amber border border-amber/30",
  low: "bg-green/15 text-green border border-green/30",
};

const TIER_BLURB: Record<RiskTier, string> = {
  high:
    "Your profile shows established deficiency risk across multiple nutrients. Acting on this now is the difference between recoverable and entrenched.",
  moderate:
    "You're in the window where deficiencies are forming but not yet entrenched. The next 30 days matter more than the previous 60.",
  low:
    "Your risk is low — but GLP-1 nutrition is a moving target. Use this as a baseline. Re-run as your dose increases.",
};

function isCompleteProfile(value: unknown): value is CompleteProfile {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    "intake" in v &&
    "profile" in v &&
    "supplements" in v &&
    "cycle" in v &&
    "gi" in v &&
    "safetyAlerts" in v
  );
}

export default function ResultsPage() {
  const router = useRouter();
  const [data, setData] = useState<CompleteProfile | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      router.replace("/intake");
      return;
    }
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (!isCompleteProfile(parsed)) {
        window.localStorage.removeItem(STORAGE_KEY);
        router.replace("/intake");
        return;
      }
      setData(parsed);
    } catch {
      router.replace("/intake");
    } finally {
      setLoaded(true);
    }
  }, [router]);

  if (!loaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div
          aria-label="Loading"
          className="h-10 w-10 animate-spin rounded-full border-2 border-border border-t-green"
        />
      </div>
    );
  }

  if (!data) return null;

  const { intake, profile, supplements, mealPlan, cycle, gi, safetyAlerts } =
    data;
  const tier = profile.riskTier;
  const tierLabel = getRiskLabel(profile.overallScore).label;

  const drugLabel = DRUG_LABEL[intake.drug];
  const durationLabel = DURATION_LABEL[intake.duration];
  const dietLabel = DIET_LABEL[intake.diet];
  const doseLabel = DOSE_LABEL[intake.dose];

  const targets: Partial<Record<NutrientKey, string>> = supplements.reduce(
    (acc, s: SupplementRecommendation) => {
      if (s.dailyTargetAmount) acc[s.deficiencyKey] = s.dailyTargetAmount;
      return acc;
    },
    {} as Partial<Record<NutrientKey, string>>,
  );

  return (
    <div className="bg-gradient-hero">
      <header className="container-page flex items-center justify-between py-6">
        <RepleteWordmark />
        <Link
          href="/intake"
          className="inline-flex min-h-[44px] items-center px-2 text-xs text-muted hover:text-text"
        >
          Re-run intake
        </Link>
      </header>

      <main className="container-page pb-16">
        <section className="mt-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-green">
            Your {drugLabel} nutrition profile
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-text sm:text-4xl">
            {drugLabel}, {durationLabel.toLowerCase()}, {dietLabel} diet
          </h1>
          <p className="mt-2 text-sm text-sub">
            {doseLabel} ·{" "}
            {intake.symptoms.filter((s) => s !== "none").length} symptom
            {intake.symptoms.filter((s) => s !== "none").length === 1
              ? ""
              : "s"}{" "}
            reported · {intake.weightLbs} lb
          </p>
          <div className="mt-3">
            <ReviewedBadge />
          </div>
        </section>

        <section className="mt-6">
          <CyclePhaseCard cycle={cycle} />
        </section>

        <section className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_1fr]">
          <div className="card-base relative overflow-hidden p-5 sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-widest text-green">
              Your daily protein target
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <AnimatedNumber
                value={profile.dailyProteinTargetG}
                className="text-6xl font-extrabold text-text sm:text-7xl"
              />
              <span className="text-xl font-semibold text-sub">g/day</span>
            </div>
            <p className="mt-2 max-w-prose text-sm text-sub">
              Body-weight scaled to 1.2–2.0 g/kg per Johnson et al. 2025
              (Obesity Pillars, PMID 41368199). GLP-1 users average 45–65 g/day
              intake — hitting this target is the single highest-leverage thing
              you can do to defend lean mass.
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg border border-border bg-bg/60 p-3">
                <p className="font-semibold uppercase tracking-widest text-muted">
                  Estimated current
                </p>
                <p className="mt-1 text-sm font-semibold text-text">
                  ~55 g/day (GLP-1 average)
                </p>
              </div>
              <div className="rounded-lg border border-border bg-bg/60 p-3">
                <p className="font-semibold uppercase tracking-widest text-muted">
                  Gap to close
                </p>
                <p className="mt-1 text-sm font-semibold text-amber">
                  ~{Math.max(0, profile.dailyProteinTargetG - 55)} g/day
                </p>
              </div>
            </div>
          </div>

          <div className="card-base flex flex-col p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">
              Overall risk
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <AnimatedNumber
                value={profile.overallScore}
                className={`text-4xl font-extrabold ${TIER_COLOR[tier]}`}
              />
              <span className="text-sm text-muted">/ 95</span>
            </div>
            <span
              className={`mt-3 inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${TIER_BADGE[tier]}`}
            >
              {tierLabel}
            </span>
            <p className="mt-3 text-sm text-sub">{TIER_BLURB[tier]}</p>
          </div>
        </section>

        {safetyAlerts.length > 0 ? (
          <section className="mt-6">
            <SafetyAlerts alerts={safetyAlerts} />
          </section>
        ) : null}

        {gi.active ? (
          <section className="mt-6">
            <GISupport gi={gi} />
          </section>
        ) : null}

        <section className="mt-8">
          <h2 className="text-xl font-bold text-text">Per-nutrient targets</h2>
          <p className="mt-1 text-sm text-sub">
            Quantitative daily targets alongside your risk score for each
            nutrient.
          </p>
          <div className="mt-3">
            <DeficiencyChart profile={profile} targets={targets} />
          </div>
        </section>

        <PersonalizedInsight data={data} />

        <section className="mt-10">
          <h2 className="text-xl font-bold text-text">Your supplement stack</h2>
          <p className="mt-1 text-sm text-sub">
            Ordered by priority, with daily targets and safety notes attached
            to each line item.
          </p>
          <div className="mt-4">
            <SupplementStack supplements={supplements} />
          </div>
          <div className="mt-4">
            <Disclaimer variant="inline" />
          </div>
        </section>

        <section className="mt-10">
          <FindRD />
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-text">Your 3-day meal plan</h2>
          <p className="mt-1 text-sm text-sub">
            Each meal is small-volume, high nutrient density, and tagged with
            the deficiency it addresses.
          </p>
          <div className="mt-4">
            <MealPlanView plan={mealPlan} />
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-text">Share your profile</h2>
          <p className="mt-1 text-sm text-sub">
            Generates an anonymous link with your drug, duration, diet, and top
            3 deficiencies. Weight, age, sex, and symptoms are excluded.
          </p>
          <div className="mt-3">
            <ShareProfileButton data={data} />
          </div>
        </section>

        <section className="mt-14">
          <div className="card-base border-l-4 border-l-green p-6 sm:p-8">
            <h2 className="text-2xl font-extrabold tracking-tight text-text">
              This is your starting point.
            </h2>
            <p className="mt-2 max-w-prose text-sm text-sub">
              The full Replete agent adapts your plan as your dose escalates,
              re-tests your profile as symptoms shift, recommends specific
              pharmacist-reviewed brands, and connects you to a community of
              other GLP-1 users at the same stage.
            </p>
            <div className="mt-5 max-w-md">
              <WaitlistForm profile={data} ctaLabel="Get the full agent" />
            </div>
            <p className="mt-3 text-xs text-muted">
              No spam. We email when there&apos;s a meaningful update — not
              before.
            </p>
          </div>
        </section>

        <section className="mt-10">
          <Disclaimer variant="results" />
        </section>
      </main>
    </div>
  );
}

function PersonalizedInsight({ data }: { data: CompleteProfile }) {
  const { intake, profile } = data;
  const drugLabel = DRUG_LABEL[intake.drug];
  const durationLabel = DURATION_LABEL[intake.duration].toLowerCase();
  const dietLabel = DIET_LABEL[intake.diet];

  const sortedNutrients = (
    Object.entries(profile) as [string, number | string][]
  )
    .filter(
      ([k]) =>
        !["overallScore", "riskTier", "dailyProteinTargetG"].includes(k),
    )
    .map(([k, v]) => ({ k, v: Number(v) }))
    .sort((a, b) => b.v - a.v);

  const top = sortedNutrients[0];
  const second = sortedNutrients[1];

  return (
    <section className="mt-6">
      <div className="card-base p-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-green">
          Why this profile, specifically
        </p>
        <p className="mt-2 text-sm text-text">
          On {drugLabel} for {durationLabel} at a{" "}
          {DOSE_LABEL[intake.dose].toLowerCase()}, a {dietLabel} eater
          predictably trends low in{" "}
          <span className="font-semibold text-text">{top.k}</span>
          {second ? (
            <>
              {" "}
              and <span className="font-semibold text-text">{second.k}</span>
            </>
          ) : null}
          . 13.6% of GLP-1 users develop vitamin D deficiency by 12 months
          (Butsch et al. 2025, Obesity Pillars, n=461,382); a separate
          cross-sectional study (Frontiers in Nutrition, March 2025, n=69)
          found average intakes of magnesium (266 mg), choline (305 mg), and
          fiber (14.5 g) all short of RDA. Your stack below closes those exact
          gaps.
        </p>
      </div>
    </section>
  );
}
