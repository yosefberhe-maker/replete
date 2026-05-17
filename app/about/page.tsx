import Link from "next/link";
import { ArrowLeft, BookOpen, ShieldCheck, Stethoscope } from "lucide-react";
import { RepleteWordmark } from "@/components/RepleteWordmark";
import Disclaimer from "@/components/Disclaimer";

export const metadata = {
  title: "About Our Clinical Standards",
  description:
    "How Replete sources, reviews, and presents nutritional guidance for GLP-1 users.",
};

export default function AboutPage() {
  return (
    <main className="bg-gradient-hero">
      <header className="container-page flex items-center justify-between py-6">
        <RepleteWordmark />
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs text-muted hover:text-text"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to home
        </Link>
      </header>

      <article className="container-page pb-20">
        <p className="text-xs font-semibold uppercase tracking-widest text-green">
          About
        </p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-text sm:text-5xl">
          About our clinical standards
        </h1>
        <p className="mt-4 max-w-2xl text-base text-sub sm:text-lg">
          Replete is built around a single rule: every recommendation traces
          to a peer-reviewed study or published clinical guideline, and every
          claim is defensible to a registered dietitian or physician
          reviewer.
        </p>

        <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Pillar
            Icon={BookOpen}
            title="Sourced from peer-reviewed literature"
          >
            Each `why` line in your supplement stack cites a specific 2025 or
            2026 study by author, journal, sample size, and DOI/PMID.
            Mechanism papers are flagged as mechanism — never extrapolated
            into population claims.
          </Pillar>
          <Pillar
            Icon={Stethoscope}
            title="Reviewed by a Registered Dietitian"
          >
            Every recommendation surface (intake logic, supplement stack,
            meal plan, GI protocol, and safety alerts) is reviewed by a
            licensed RD before it ships. Reviewer names and credentials are
            listed below.
          </Pillar>
          <Pillar
            Icon={ShieldCheck}
            title="Safety guardrails are non-negotiable"
          >
            Potassium is always food-only — supplements can cause
            hyperkalemia. Iron is gated by ferritin guidance. Drug-interaction
            warnings (calcium + iron, magnesium + bisphosphonates, iron +
            levothyroxine) are surfaced inline, not buried.
          </Pillar>
        </section>

        <section className="mt-12 max-w-2xl">
          <h2 className="text-2xl font-bold text-text">
            How a recommendation gets onto your page
          </h2>
          <ol className="mt-4 flex flex-col gap-3 text-sm text-sub">
            <li className="flex gap-3">
              <span className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green/15 text-xs font-semibold text-green">
                1
              </span>
              <span>
                A literature search identifies a candidate intervention — a
                published trial, observational study, or guideline.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green/15 text-xs font-semibold text-green">
                2
              </span>
              <span>
                A registered dietitian reviews the study quality, sample
                size, and relevance to GLP-1 users specifically. Narrative
                reviews are flagged as such; mechanism papers don&apos;t
                support population claims.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="mt-0.5 inline-flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-green/15 text-xs font-semibold text-green">
                3
              </span>
              <span>
                The recommendation is added to the engine with its citation,
                threshold, and dose. The reviewer signs off on the wording
                surfaced to you.
              </span>
            </li>
          </ol>
        </section>

        <section className="mt-12 max-w-2xl">
          <h2 className="text-2xl font-bold text-text">
            What Replete is — and is not
          </h2>
          <p className="mt-3 text-sm text-sub">
            Replete is educational nutritional guidance designed for adult
            GLP-1 users in the United States. It is not medical nutrition
            therapy, it does not diagnose, treat, or replace your prescribing
            provider, and it is not a substitute for laboratory testing where
            indicated. If a recommendation here conflicts with advice from
            your physician or registered dietitian, follow theirs.
          </p>
        </section>

        <section className="mt-10">
          <Disclaimer variant="results" />
        </section>
      </article>
    </main>
  );
}

function Pillar({
  Icon,
  title,
  children,
}: {
  Icon: typeof BookOpen;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card-base p-5">
      <span
        className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-green/10 text-green"
        aria-hidden
      >
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="mt-3 text-base font-semibold text-text">{title}</h3>
      <p className="mt-2 text-sm text-sub">{children}</p>
    </div>
  );
}
