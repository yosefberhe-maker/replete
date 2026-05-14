import Link from "next/link";
import { ArrowRight, ClipboardList, Sparkles, UtensilsCrossed } from "lucide-react";
import { RepleteWordmark } from "@/components/RepleteWordmark";
import WaitlistForm from "@/components/WaitlistForm";
import SamplePreview from "@/components/SamplePreview";
import HeroAnimation from "@/components/HeroAnimation";

const WAITLIST_COUNT = "2,400+";

export default function HomePage() {
  return (
    <>
      <header className="border-b border-border/60 bg-bg/80 backdrop-blur">
        <div className="container-page flex h-14 items-center justify-between">
          <RepleteWordmark />
          <nav className="flex items-center gap-4 text-sm">
            <Link
              href="/intake"
              className="text-sub transition-colors hover:text-text"
            >
              Take the intake
            </Link>
            <Link href="/intake" className="btn-primary hidden sm:inline-flex">
              Get my plan
            </Link>
          </nav>
        </div>
      </header>

      <Hero />
      <StatsStrip />
      <HowItWorks />
      <Credibility />
      <PreviewSection />
      <WaitlistSection />
      <SiteFooter />
    </>
  );
}

function Hero() {
  return (
    <section className="bg-gradient-hero">
      <div className="container-page py-16 sm:py-24">
        <HeroAnimation>
          <p className="text-xs font-semibold uppercase tracking-widest text-green">
            Precision nutrition for GLP-1 users
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight text-text text-balance sm:text-5xl md:text-6xl">
            GLP-1 is changing your body. Your nutrition plan hasn&apos;t kept up.
          </h1>
          <p className="mt-5 max-w-2xl text-base text-sub sm:text-lg">
            88% of GLP-1 users are below optimal intake for 4+ key nutrients.
            Replete tells you exactly which ones — and what to do about it.
          </p>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link href="/intake" className="btn-primary inline-flex w-full sm:w-auto">
              Get my free plan
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <span className="text-xs text-muted">
              2 minutes · No account needed
            </span>
          </div>
        </HeroAnimation>
      </div>
    </section>
  );
}

function StatsStrip() {
  return (
    <section className="border-y border-border bg-card">
      <div className="container-page py-10">
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              big: "88–98%",
              label: "GLP-1 users below magnesium targets",
            },
            {
              big: "6+",
              label: "Key nutrients depleted by reduced intake",
            },
            {
              big: "0",
              label: "Consumer platforms addressing this gap",
            },
          ].map((s) => (
            <div key={s.big} className="text-center sm:text-left">
              <p className="text-4xl font-extrabold tracking-tight text-green sm:text-5xl">
                {s.big}
              </p>
              <p className="mt-2 text-sm text-sub">{s.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-muted sm:text-left">
          Sources: Frontiers in Nutrition (2025) · Joint Advisory, ACLM / ASN / OMA / The Obesity Society (2025)
        </p>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      Icon: ClipboardList,
      n: "01",
      title: "Answer 5 questions",
      body: "Drug, duration, dose, diet, and symptoms. Two minutes, mobile-first, no account.",
    },
    {
      Icon: Sparkles,
      n: "02",
      title: "Get your deficiency profile",
      body: "A per-nutrient risk score, an overall tier, and a personalized supplement stack.",
    },
    {
      Icon: UtensilsCrossed,
      n: "03",
      title: "Follow your meal + supplement plan",
      body: "Curated for your dose and diet. Plan adapts as your regimen changes.",
    },
  ];
  return (
    <section className="container-page py-16 sm:py-24">
      <h2 className="text-3xl font-extrabold tracking-tight text-text sm:text-4xl">
        How Replete works
      </h2>
      <p className="mt-2 max-w-prose text-sub">
        Built around the only thing that matters: getting you the right
        nutrients in the limited window your appetite gives you.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {steps.map((s) => (
          <div key={s.n} className="card-base p-6">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-green/10 text-green">
                <s.Icon className="h-5 w-5" />
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-muted">
                Step {s.n}
              </span>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-text">{s.title}</h3>
            <p className="mt-2 text-sm text-sub">{s.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Credibility() {
  return (
    <section className="border-y border-border bg-bg/60">
      <div className="container-page py-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted">
          Built on peer-reviewed clinical research
        </p>
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-sub">
          <span>American College of Lifestyle Medicine</span>
          <span>American Society for Nutrition</span>
          <span>The Obesity Society</span>
          <span>Obesity Medicine Association</span>
          <span>Frontiers in Nutrition (2025)</span>
        </div>
      </div>
    </section>
  );
}

function PreviewSection() {
  return (
    <section className="container-page py-16 sm:py-24">
      <div className="grid items-center gap-10 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-green">
            Sample output
          </p>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-text sm:text-4xl">
            A real number for every nutrient.
          </h2>
          <p className="mt-3 max-w-prose text-sub">
            We score your risk across protein, B12, iron, magnesium, zinc,
            vitamin D, choline, and potassium. Your stack is built around the
            specific nutrients you&apos;re likely missing — not a generic GLP-1
            multivitamin.
          </p>
          <Link
            href="/intake"
            className="btn-primary mt-6 inline-flex w-full sm:w-auto"
          >
            Build my profile
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </div>
        <SamplePreview />
      </div>
    </section>
  );
}

function WaitlistSection() {
  return (
    <section className="container-page py-16 sm:py-24">
      <div className="card-base border border-border bg-card2 p-6 sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-green">
          Waitlist
        </p>
        <h2 className="mt-2 text-3xl font-extrabold tracking-tight text-text sm:text-4xl">
          Be first when we launch the full agent.
        </h2>
        <p className="mt-2 text-sub">
          Join {WAITLIST_COUNT} GLP-1 users already on the waitlist. You&apos;ll
          get your starting plan immediately and updates as your dose changes.
        </p>
        <div className="mt-6 max-w-md">
          <WaitlistForm variant="card" />
        </div>
        <p className="mt-3 text-xs text-muted">
          We will only email you with meaningful updates. Unsubscribe anytime.
        </p>
      </div>
    </section>
  );
}

function SiteFooter() {
  return (
    <section className="border-t border-border bg-bg">
      <div className="container-page py-10 text-sm">
        <RepleteWordmark size="sm" />
        <p className="mt-3 max-w-prose text-sub">
          Precision nutrition for GLP-1 users. Built on clinical nutrition research.
        </p>
      </div>
    </section>
  );
}
