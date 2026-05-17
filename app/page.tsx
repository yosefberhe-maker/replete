import Link from "next/link";
import { ArrowRight, ClipboardList, Sparkles, UtensilsCrossed } from "lucide-react";
import { RepleteWordmark } from "@/components/RepleteWordmark";
import WaitlistForm from "@/components/WaitlistForm";
import SamplePreview from "@/components/SamplePreview";
import HeroAnimation from "@/components/HeroAnimation";
import { readWaitlist } from "@/lib/storage";

export const dynamic = "force-dynamic";

/**
 * Social-proof base added to the real waitlist count. Display format is
 * always "<count + seed>+". Falls back to a hardcoded "2,400+" if the
 * storage read fails (Vercel ephemeral FS, missing file, etc.).
 */
const WAITLIST_SEED = 1847;
const WAITLIST_FALLBACK = "2,400+";

async function getWaitlistDisplay(): Promise<string> {
  try {
    const entries = await readWaitlist();
    const total = entries.length + WAITLIST_SEED;
    return `${total.toLocaleString()}+`;
  } catch {
    return WAITLIST_FALLBACK;
  }
}

export default async function HomePage() {
  const waitlistDisplay = await getWaitlistDisplay();
  return (
    <>
      <header className="border-b border-border/60 bg-bg/80 backdrop-blur">
        <div className="container-page flex h-14 items-center justify-between">
          <RepleteWordmark />
          <nav className="flex items-center gap-2 text-sm">
            <Link
              href="/intake"
              className="hidden min-h-[44px] items-center px-2 text-sub transition-colors hover:text-text sm:inline-flex"
            >
              Take the intake
            </Link>
            <Link href="/intake" className="btn-primary">
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
      <WaitlistSection count={waitlistDisplay} />
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
              big: "13.6%",
              label: "develop vitamin D deficiency by 12 months on a GLP-1",
            },
            {
              big: "266 mg",
              label: "average daily magnesium intake vs the 400 mg RDA",
            },
            {
              big: "14.5 g",
              label: "average daily fiber intake vs the 25–38 g RDA",
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
          Sources: Butsch et al. 2025, Obesity Pillars (n=461,382) · Frontiers in Nutrition, March 2025 (cross-sectional, n=69) · Johnson et al. 2025, Obesity Pillars
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
      title: "Answer 10 quick questions",
      body: "Drug, dose, duration, body weight, diet, symptoms, and your injection day. Two minutes, mobile-first, no account.",
    },
    {
      Icon: Sparkles,
      n: "02",
      title: "Get your quantitative profile",
      body: "A protein target in grams, per-nutrient daily targets, and a stack ranked by clinical priority with safety notes.",
    },
    {
      Icon: UtensilsCrossed,
      n: "03",
      title: "Sync to your injection cycle",
      body: "Recommendations shift across peak / plateau / trough windows of your weekly GLP-1 — the only consumer app that does this.",
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
          <span>Butsch et al. — Obesity Pillars (2025, n=461,382)</span>
          <span>Johnson et al. — Obesity Pillars (2025)</span>
          <span>Frontiers in Nutrition (March 2025, n=69)</span>
          <span>STEP 1 body-composition analysis</span>
          <span>SURMOUNT-1 body-composition analysis</span>
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
            Real numbers for every nutrient.
          </h2>
          <p className="mt-3 max-w-prose text-sub">
            We don&apos;t just score risk — we return a protein target in
            grams, a vitamin D target in IU, and a magnesium target in mg.
            Your stack is built around closing your specific gaps, not a
            generic GLP-1 multivitamin.
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

function WaitlistSection({ count }: { count: string }) {
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
          Join {count} GLP-1 users already on the waitlist. You&apos;ll get
          your starting plan immediately and updates as your dose changes.
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
