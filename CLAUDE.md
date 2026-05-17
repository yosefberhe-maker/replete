# Replete — GLP-1 Nutrition Intelligence Agent
## Master Context File for Claude Code

This file is the single source of truth for building Replete. Read it completely before executing any task. Every decision should be made in reference to what's here.

---

## What We're Building

Replete is a consumer-facing AI agent that solves a real, clinically documented gap: GLP-1 users (Ozempic, Wegovy, Mounjaro, Zepbound) eating 30–40% fewer calories are developing measurable micronutrient deficiencies that nobody is managing. 88–98% of GLP-1 users in peer-reviewed studies are below recommended intake for magnesium, iron, vitamin D, potassium, and choline. No consumer platform addresses this.

**The product does three things:**
1. Takes a 5-question intake (drug, duration, dose, diet, symptoms)
2. Calculates a personalized deficiency risk profile using the clinical algorithm below
3. Outputs a prioritized supplement stack + adapted 3-day meal framework

**The business goal:** Build acquisition-ready momentum in 90 days. Target acquirers are Hims/Hers, Noom, Found Health, Ro, GoodRx. We are NOT building for 5-year profitability — we are building a proof of concept with strong engagement signals, clinical credibility, and early revenue from supplement fulfillment.

---

## Brand

**Name:** Replete  
**Tagline:** Precision nutrition for GLP-1 users. Know exactly what your body needs.  
**Voice:** Direct. Science-backed. Not clinical. Not diet-culture. The insider knowledge your pharmacist has but doesn't have time to tell you.  
**Tone reference:** Hims/Hers (accessible, frank) + InsideTracker (credible, data-led) — not Noom (behavioral/emotional)

**Color System:**
```
--bg:       #080C14   (near-black navy background)
--card:     #0F1623   (card surface)
--card2:    #161E2E   (elevated card)
--border:   #1E293B   (subtle borders)
--green:    #10B981   (primary — emerald, action, success)
--green-dim:#064E3B   (green background tint)
--amber:    #F59E0B   (moderate risk)
--red:      #EF4444   (high risk)
--blue:     #3B82F6   (secondary accent)
--text:     #F1F5F9   (primary text)
--muted:    #64748B   (secondary text)
--sub:      #94A3B8   (tertiary / labels)
```

**Typography:** Inter (primary), system-ui fallback. Weights: 400 body, 600 semibold, 700 bold, 800 extrabold for headlines.

---

## Tech Stack

```
Framework:    Next.js 14 (App Router)
Language:     TypeScript (strict)
Styling:      Tailwind CSS + CSS variables above
Components:   Shadcn/UI for primitives
Animation:    Framer Motion
Charts:       Recharts
Email:        Resend (resend.com)
Database:     Supabase (postgres) OR simple JSON for MVP
Auth:         None for MVP (waitlist only)
Deployment:   Vercel
Package mgr:  pnpm
```

**Install command:**
```bash
pnpm create next-app@latest replete --typescript --tailwind --app --no-src-dir
cd replete
pnpm add framer-motion recharts @radix-ui/react-slot class-variance-authority clsx tailwind-merge lucide-react resend
pnpm add -D @types/node
```

---

## Project Structure

```
replete/
├── app/
│   ├── page.tsx              # Marketing landing page
│   ├── intake/page.tsx       # 5-step wizard
│   ├── results/page.tsx      # Personalized output
│   ├── api/
│   │   ├── waitlist/route.ts # Email capture + Resend
│   │   └── analyze/route.ts  # Runs deficiency engine
│   ├── admin/page.tsx        # Internal dashboard
│   └── tools/
│       └── reddit/page.tsx   # Reddit content generator
├── components/
│   ├── IntakeWizard.tsx
│   ├── DeficiencyChart.tsx
│   ├── SupplementStack.tsx
│   ├── MealPlan.tsx
│   ├── WaitlistForm.tsx
│   └── ui/                   # Shadcn components
├── lib/
│   ├── deficiency-engine.ts  # Core IP — the algorithm
│   ├── supplement-data.ts    # Full supplement database
│   ├── meal-data.ts          # Meal frameworks by diet type
│   └── email-sequences.ts    # Drip email content
├── types/
│   └── index.ts              # All shared types
└── CLAUDE.md                 # This file
```

---

## The Deficiency Engine — Core IP

This is the most important code in the entire project. It must be accurate, type-safe, and well-tested.

### Types

```typescript
export type Drug = 'sema' | 'tirz' | 'other'
export type Duration = '0-3' | '3-6' | '6-12' | '12+'
export type Dose = 'starter' | 'moderate' | 'high'
export type Diet = 'omni' | 'veg' | 'vegan' | 'keto'
export type Symptom = 'fatigue' | 'hairloss' | 'muscle' | 'brainfog' | 'nausea' | 'none'

export interface IntakeData {
  drug: Drug
  duration: Duration
  dose: Dose
  diet: Diet
  symptoms: Symptom[]
}

export interface DeficiencyProfile {
  protein: number      // 0–95 risk score
  b12: number
  iron: number
  magnesium: number
  zinc: number
  vitaminD: number
  choline: number
  potassium: number
  overallScore: number
  riskTier: 'high' | 'moderate' | 'low'
}

export type SupplementPriority = 'critical' | 'high' | 'support'

export interface SupplementRecommendation {
  id: string
  name: string
  dose: string
  timing: string
  form: string          // e.g. "methylcobalamin" not just "B12"
  why: string
  priority: SupplementPriority
  deficiencyKey: keyof Omit<DeficiencyProfile, 'overallScore' | 'riskTier'>
  icon: string
  caution?: string
}

export interface MealPlan {
  days: MealDay[]
  philosophy: string
  keyPrinciples: string[]
}
```

### Algorithm Logic

```typescript
// Base risk scores (everyone on GLP-1 has some level)
const BASE: Record<string, number> = {
  protein: 40, b12: 25, iron: 20, magnesium: 35,
  zinc: 20, vitaminD: 30, choline: 25, potassium: 20
}

// Duration multipliers — deficiencies compound
const DURATION_BOOST: Record<Duration, number> = {
  '0-3': 0, '3-6': 22, '6-12': 38, '12+': 52
}

// Dose multipliers — higher dose = more appetite suppression = more deficit
const DOSE_BOOST: Record<Dose, number> = {
  starter: 0, moderate: 18, high: 30
}

// Diet modifiers
if diet === 'veg':  b12 += 28, iron += 22, zinc += 18, choline += 20
if diet === 'vegan': b12 += 40, iron += 30, zinc += 25, choline += 30, vitaminD += 15
if diet === 'keto':  magnesium += 20, potassium += 25, vitaminD += 10

// Drug-specific modifiers
if drug === 'tirz':  protein += 10, magnesium += 8  // dual agonist = stronger appetite suppression

// Symptom signal mapping (these are direct diagnostic signals)
fatigue   → iron += 20, b12 += 15, vitaminD += 12
hairloss  → zinc += 25, iron += 15, protein += 20
muscle    → protein += 30, magnesium += 15
brainfog  → choline += 25, b12 += 18
nausea    → potassium += 18, magnesium += 12

// Cap all values at 95
// overallScore = average of all 8 nutrients
// riskTier: >= 65 = 'high', >= 40 = 'moderate', else 'low'
```

### Supplement Recommendations

Map deficiency scores to recommendations. Only show supplements where score >= threshold:

| Nutrient   | Show if score >= | Priority if >= | Recommended form              |
|------------|-----------------|----------------|-------------------------------|
| protein    | 40              | critical: 65   | Whey or plant blend, 25–35g/day |
| magnesium  | 35              | high: 60       | Glycinate 200–400mg at bedtime |
| b12        | 35              | critical: 65   | Methylcobalamin 1000mcg sublingual |
| vitaminD   | 30              | high: 55       | D3+K2 (MK-7) 2000–4000 IU with food |
| zinc       | 40              | high: 65       | Picolinate 25–50mg with food |
| iron       | 40              | critical: 65   | Ferrous bisglycinate 18–36mg with vitamin C |
| choline    | 40              | high: 60       | CDP-Choline 250–500mg |
| potassium  | Always dietary  | n/a            | Food sources only (never supplement without labs) |

**IMPORTANT:** Potassium should always be listed as dietary sources only — avocado, spinach, banana, sweet potato. Never recommend potassium supplements without lab confirmation. This is a safety rule.

### Meal Plan Logic

Three meal days, adapted by diet type. Each meal must:
- Be small volume, high nutrient density
- Lead with protein
- Be easy on GI (no heavy/greasy foods)
- Include a brief "why" note explaining which deficiency it addresses

Diet adaptations:
- `omni`: salmon, eggs, Greek yogurt, lean meats as protein anchors
- `veg`: Greek yogurt, eggs, lentils, tempeh, edamame
- `vegan`: tofu, tempeh, legumes, hemp seeds, plant protein, nutritional yeast
- `keto`: fatty fish, eggs, cheese, beef, avocado, leafy greens

---

## The 5-Step Intake Wizard

**Step 1 — Drug**
- Semaglutide (Ozempic · Wegovy · Rybelsus) [badge: "Most common"]
- Tirzepatide (Mounjaro · Zepbound) [badge: "Dual agonist"]
- Other / Not sure (Liraglutide · Dulaglutide · Compounded)

**Step 2 — Duration**
- Less than 3 months — "Early stage — mostly side-effect management"
- 3–6 months — "Deficiencies starting to develop"
- 6–12 months — "Compounding nutrient gaps — critical window"
- Over a year — "High risk of established deficiencies"

**Step 3 — Dose**
- Starter / titrating up (0.25–0.5mg sema · 2.5–5mg tirz)
- Moderate maintenance (1–1.7mg sema · 10–12.5mg tirz)
- Full / high dose (2–2.4mg sema · 15mg tirz)

**Step 4 — Diet**
- Omnivore, Vegetarian, Vegan / Plant-based, Keto / Low-carb

**Step 5 — Symptoms (multi-select)**
- Fatigue or low energy
- Hair thinning or loss
- Muscle weakness or loss
- Brain fog or poor focus
- Nausea or GI discomfort
- None of these yet

Each step: single full-width option cards (large tap targets, mobile-first), animated progress bar, smooth Framer Motion transitions between steps.

---

## Marketing Landing Page — Copy & Structure

### Hero
**Headline:** "GLP-1 is changing your body. Your nutrition plan hasn't kept up."
**Sub:** "88% of GLP-1 users are below optimal intake for 4+ key nutrients. Replete tells you exactly which ones — and what to do about it."
**CTA:** "Get My Free Plan" → leads to intake wizard

### Stats Strip (full-width dark bar)
- 88–98% of GLP-1 users below magnesium targets (Frontiers in Nutrition, 2025)
- 6+ nutrients depleted by reduced intake
- 0 platforms addressing this gap

### How It Works (3 steps)
1. Answer 5 questions about your regimen
2. Get your personalized deficiency risk profile
3. Follow your supplement + meal plan — updated as you go

### Social Proof / Credibility
"Built on the 2025 joint advisory from the American College of Lifestyle Medicine, American Society for Nutrition, The Obesity Society, and Obesity Medicine Association."

### Sample Result Preview
Show a redacted/blurred version of the results dashboard to demonstrate what they'll receive.

### Waitlist CTA
**Headline:** "Be first when we launch the full agent."
**Sub:** "Join 2,400+ GLP-1 users already on the waitlist."  
(This number updates — start at a realistic early number and update as signups grow)

---

## Email Sequences

### Welcome Email (send immediately on signup)
Subject: "Your GLP-1 nutrition profile is ready"
Content: Their top 3 deficiency risks, top 2 supplement recommendations, one meal tip. Friendly, direct. No fluff. Links back to full results.

### Day 3: The Protein Problem
Subject: "The #1 mistake GLP-1 users make with protein"
Content: Education on why protein needs stay constant even as calories drop. Introduces protein recommendation from their profile.

### Day 7: The Hair Loss Question
Subject: "Why your hair might be thinning (and what to do)"
Content: Zinc + iron + protein connection. Highly searched topic. Drives re-engagement and supplement consideration.

### Day 14: The Supplement Stack
Subject: "Your personalized supplement stack — ranked"
Content: Full breakdown of their specific recommendations in priority order with specific product guidance.

### Day 30: Check-In
Subject: "30 days in — how is your energy?"
Content: Re-engage for feedback. Ask about symptoms. Offer to re-run their profile if dose has changed. This is the retention moment.

---

## Reddit Content Strategy

Target communities: r/Semaglutide (500K+), r/WegovyWeightLoss, r/Ozempic, r/Mounjaro

**Content rules:**
- Always lead with genuinely helpful information
- Only mention Replete when directly relevant and honest
- Never shill — participate as a knowledgeable community member
- Answer the real question first, Replete is an aside

**Top question types to target:**
1. "Why am I so tired on Ozempic?"
2. "Hair loss on Wegovy — is this normal?"
3. "What supplements should I take on semaglutide?"
4. "I'm not eating much — what should I eat?"
5. "Brain fog on GLP-1 — anyone else?"

---

## Admin Dashboard Metrics (what matters for acquisition)

These are the signals an acquirer will look at:
- Total waitlist signups (absolute + weekly growth rate)
- Intake completion rate (how many start vs. finish the 5 steps)
- Most common deficiency profiles (shows product-market fit)
- Supplement recommendation click-through rate
- Email open rates by sequence step
- Return visit rate (within 30 days)

---

## Legal / Disclaimer

Every page must include: "Replete provides general nutritional information based on published clinical research. This is not medical advice. Consult your healthcare provider before starting any supplement regimen."

Potassium supplement recommendations are explicitly excluded from automated output. Users are directed to get lab work to confirm potassium levels before supplementing.

---

## Build Sequence

Build in this order. Each task is in PROMPTS.md.

1. Project scaffold + design system
2. Deficiency engine (TypeScript, fully tested)
3. Intake wizard component
4. Results dashboard
5. Marketing landing page
6. Waitlist API + email sequences
7. Admin dashboard
8. Reddit content generator tool

Do not skip ahead. Each component depends on the previous.

---

## Sources / Clinical Foundation

- Frontiers in Nutrition (2025): 88–98% of GLP-1 users below targets for magnesium, iron, vitamin D, potassium, choline
- Joint Advisory 2025 (ACLM, ASN, OMA, The Obesity Society): Most GLP-1 patients don't receive adequate nutritional counseling
- USDA FoodData Central: Nutrition database
- Edamam API ($299/mo): Recipe analysis and meal planning data

---

## Autonomous Agent Configuration

### Agent Role
This repo is managed by an autonomous research agent that:
1. Searches PubMed for new GLP-1 clinical papers weekly
2. Validates health claims against current `supplement-data.ts`
3. Proposes updates when new evidence supersedes existing data
4. Runs the full test suite before any commit
5. Maintains an audit trail in `.agent-session/task-log.jsonl`

### Running the Agent

```bash
bash scripts/agent-run.sh           # Full run
bash scripts/agent-run.sh --dry-run # Preview only, no commits
```

### Agent Memory

- `.agent-session/claim-registry.json` — all claims ever processed
- `.agent-session/last-verified.json` — last scan timestamp + next research topics
- `.agent-session/task-log.jsonl` — full audit trail (append-only)

### Safety Rules (Hardwired)

- NEVER commit unverified medical claims
- NEVER push to main without passing `pnpm test`
- NEVER modify test files
- NEVER delete existing verified claims without documented supersession
- ALL clinical data changes require a source PMID in the commit message

### Context → Action → Verify Loop

Every agent cycle follows:

1. **CONTEXT**: Read `last-verified.json` + `claim-registry.json`
2. **ACTION**: Research papers → extract claims → validate
3. **VERIFY**: `pnpm test` must pass before any write

### Skills Available

- `/research-papers` — search PubMed for new studies
- `/validate-claims` — cross-check claims vs codebase
- `/update-codebase` — apply verified findings

### Sub-agents

- `researcher` — finds and summarizes papers (read-only, no git)
- `validator` — grades evidence (A/B/C) and decides write eligibility
- `engineer` — minimal source edits + tests + commit with `Sourced: PMID:` trailer

---

*Last updated: May 2026. Maintained by Yosef Berhe.*
