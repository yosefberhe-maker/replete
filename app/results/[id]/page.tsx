import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { RepleteWordmark } from "@/components/RepleteWordmark";
import { findSharedProfile } from "@/lib/storage";
import { getRiskLabel } from "@/lib/deficiency-engine";
import { DRUG_LABEL, DURATION_LABEL, DIET_LABEL, DOSE_LABEL } from "@/lib/copy";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { id: string };
}

const siteName = "Replete";

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const shared = await findSharedProfile(params.id.toUpperCase());
  if (!shared) {
    return {
      title: "Shared profile",
      description: "This shared GLP-1 nutrition profile is no longer available.",
    };
  }
  const drugLabel = DRUG_LABEL[shared.drug];
  const durationLabel = DURATION_LABEL[shared.duration].toLowerCase();
  const dietLabel = DIET_LABEL[shared.diet];
  const tier = getRiskLabel(shared.overallScore).label;
  const title = `${drugLabel} · ${dietLabel} diet — ${tier} deficiency risk`;
  const description = `Anonymous GLP-1 nutrition profile: ${drugLabel}, ${durationLabel}, ${dietLabel} diet. Top 3 deficiency risks ranked.`;

  return {
    title,
    description,
    openGraph: {
      title: `${title} · ${siteName}`,
      description,
      type: "article",
      siteName,
      images: [{ url: "/opengraph-image", width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · ${siteName}`,
      description,
      images: ["/opengraph-image"],
    },
  };
}

const TIER_COLOR = {
  high: "text-red",
  moderate: "text-amber",
  low: "text-green",
} as const;

const TIER_BADGE = {
  high: "bg-red/15 text-red border border-red/30",
  moderate: "bg-amber/15 text-amber border border-amber/30",
  low: "bg-green/15 text-green border border-green/30",
} as const;

const PRIORITY_LABEL = {
  critical: "Critical",
  high: "High",
  support: "Support",
} as const;

const PRIORITY_CHIP = {
  critical: "bg-red/15 text-red",
  high: "bg-amber/15 text-amber",
  support: "bg-green/15 text-green",
} as const;

export default async function SharedProfilePage({ params }: PageProps) {
  const shared = await findSharedProfile(params.id.toUpperCase());
  if (!shared) notFound();

  const drugLabel = DRUG_LABEL[shared.drug];
  const tierLabel = getRiskLabel(shared.overallScore).label;

  return (
    <main className="bg-gradient-hero">
      <header className="container-page flex items-center justify-between py-6">
        <RepleteWordmark />
        <span className="text-xs text-muted">Shared profile</span>
      </header>

      <section className="container-page pb-16">
        <p className="text-xs font-semibold uppercase tracking-widest text-green">
          Anonymous shared profile · code {shared.code}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-text sm:text-4xl">
          {drugLabel}, {DURATION_LABEL[shared.duration].toLowerCase()},{" "}
          {DIET_LABEL[shared.diet]} diet
        </h1>
        <p className="mt-2 text-sm text-sub">
          {DOSE_LABEL[shared.dose]} · No personal details are shown — weight,
          age, sex, and symptoms are excluded.
        </p>

        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="card-base p-5 sm:col-span-1">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">
              Overall risk
            </p>
            <p
              className={`mt-2 text-5xl font-extrabold ${TIER_COLOR[shared.riskTier]}`}
            >
              {shared.overallScore}
              <span className="ml-1 text-sm font-medium text-muted">/ 95</span>
            </p>
            <span
              className={`mt-3 inline-flex w-fit items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${TIER_BADGE[shared.riskTier]}`}
            >
              {tierLabel}
            </span>
          </div>

          <div className="card-base p-5 sm:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted">
              Top 3 deficiency risks
            </p>
            <ul className="mt-3 flex flex-col gap-3">
              {shared.topDeficiencies.map((d) => (
                <li
                  key={d.key}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="font-semibold text-text">{d.label}</span>
                  <span
                    className={`text-xs font-semibold ${TIER_COLOR[getRiskLabel(d.score).tier]}`}
                  >
                    {getRiskLabel(d.score).label} · {d.score}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mt-8">
          <h2 className="text-xl font-bold text-text">Recommended stack</h2>
          <p className="mt-1 text-sm text-sub">
            Ranked by clinical priority. Specific doses and timings are in the
            full Replete profile.
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {shared.supplements.map((s) => (
              <li key={s.id} className="card-base p-4">
                <div className="flex items-center justify-between gap-2">
                  <p className="flex items-center gap-2 text-sm font-semibold text-text">
                    <span aria-hidden>{s.icon}</span>
                    {s.name}
                  </p>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${PRIORITY_CHIP[s.priority]}`}
                  >
                    {PRIORITY_LABEL[s.priority]}
                  </span>
                </div>
                <p className="mt-1 text-xs text-sub">{s.dose}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10">
          <div className="card-base border-l-4 border-l-green p-6 sm:p-8">
            <h2 className="text-2xl font-extrabold tracking-tight text-text">
              Want your own profile?
            </h2>
            <p className="mt-2 max-w-prose text-sm text-sub">
              Replete builds a personalized deficiency profile, supplement
              stack, and meal framework in two minutes — synced to your GLP-1
              injection cycle. No account required.
            </p>
            <Link
              href="/intake"
              className="btn-primary mt-5 inline-flex min-h-[44px] items-center"
            >
              Build my profile
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </section>
      </section>
    </main>
  );
}
