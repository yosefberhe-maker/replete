# Replete — Claude Code Build Sequence
## Run these prompts in order in Claude Code Max

Each prompt is self-contained but builds on the previous. Read CLAUDE.md before starting any session.
Paste each prompt directly into Claude Code in your terminal.

---

## HOW TO START

```bash
cd ~/Desktop/replete
claude
```

Then paste Prompt 1 below. Work through them in order.
Claude Code will read CLAUDE.md automatically from the project root.

---

## PROMPT 1 — Project Scaffold + Design System

```
Read CLAUDE.md completely. Then:

1. Initialize a Next.js 14 app with TypeScript, Tailwind CSS, and the App Router in this directory. Use pnpm. Do not create a new subdirectory — scaffold directly here.

2. Install all dependencies from the tech stack in CLAUDE.md.

3. Create a global CSS file (app/globals.css) with the exact CSS variables from the Color System section of CLAUDE.md. Configure Tailwind to use these variables as custom colors so I can write classes like `bg-bg`, `text-green`, `border-border`.

4. Create the base layout (app/layout.tsx) with: Inter font from Google Fonts, the dark background color, proper viewport meta, and the legal disclaimer in a small footer bar on every page.

5. Create the full folder structure from the Project Structure section of CLAUDE.md — all folders and empty placeholder files. Each placeholder should have a single comment: "// TODO: Implement in Prompt N" where N is the prompt number that builds it.

6. Create app/loading.tsx with a simple centered animated spinner using the green brand color.

7. Create app/not-found.tsx with a clean 404 page matching the brand.

Verify the app runs with `pnpm dev` before finishing. Report any errors and fix them.
```

---

## PROMPT 2 — Deficiency Engine (Core IP)

```
Read CLAUDE.md — specifically the "Deficiency Engine — Core IP" section. This is the most important code in the project.

1. Create types/index.ts with ALL types defined in CLAUDE.md: Drug, Duration, Dose, Diet, Symptom, IntakeData, DeficiencyProfile, SupplementPriority, SupplementRecommendation, MealPlan, MealDay, Meal.

2. Create lib/deficiency-engine.ts implementing:
   - calculateDeficiencies(intake: IntakeData): DeficiencyProfile
     Use the exact algorithm logic from CLAUDE.md including all base scores, duration boosts, dose boosts, diet modifiers, drug modifiers, and symptom signal mapping.
   - getRiskLabel(score: number): { label: string, tier: 'high' | 'moderate' | 'low' }
     >= 65 = high, >= 40 = moderate, else low

3. Create lib/supplement-data.ts implementing:
   - getSupplementRecommendations(profile: DeficiencyProfile): SupplementRecommendation[]
     Use the full supplement table from CLAUDE.md. Sort by priority (critical first).
     IMPORTANT: Potassium must ALWAYS be returned as a dietary-only recommendation — never as a supplement. This is a safety rule.

4. Create lib/meal-data.ts implementing:
   - getMealPlan(intake: IntakeData, profile: DeficiencyProfile): MealPlan
     Return a 3-day meal plan adapted to the user's diet type (omni/veg/vegan/keto).
     Each meal must include: type, name, why (which deficiency it addresses), protein estimate.

5. Write comprehensive unit tests in __tests__/deficiency-engine.test.ts:
   - Test all 4 diet types
   - Test all duration/dose combinations  
   - Test each symptom modifier
   - Test the tirzepatide drug modifier
   - Test that potassium never returns as a supplement
   - Test edge cases (no symptoms selected, starter dose at 0-3 months)

Run tests and fix all failures before completing.
```

---

## PROMPT 3 — Intake Wizard

```
Read CLAUDE.md — the "5-Step Intake Wizard" section and the Color System.

Build components/IntakeWizard.tsx as a complete multi-step form:

1. State management: use useReducer to manage { currentStep, answers, isComplete }. Store answers in the IntakeData shape from types/index.ts.

2. Step rendering: create a StepRenderer that maps to the 5 step configurations in CLAUDE.md. Each step has title, subtitle, type (single | multi), key, and options array.

3. Option cards: 
   - Single-select: large tap-target cards with animated selection state (border turns green, checkmark appears)
   - Multi-select (step 5): checkbox-style cards, multiple can be selected
   - Each card shows main text, sub text, and optional badge
   - Selected state uses --green border and dark green background tint

4. Progress: animated progress bar (Framer Motion width transition), step counter "Step X of 5".

5. Navigation: Continue button (disabled/dimmed until selection made, active when ready), Back button, smooth Framer Motion slide transitions between steps (slide left on forward, slide right on back).

6. On completion: call calculateDeficiencies + getSupplementRecommendations + getMealPlan from the engine, store result in localStorage as 'replete_profile', then navigate to /results.

7. Mobile-first: minimum tap targets 48px, comfortable padding, everything works perfectly on a 375px screen.

8. Create app/intake/page.tsx that renders <IntakeWizard /> with a simple header showing the Replete logo.

Test on mobile viewport in browser before finishing.
```

---

## PROMPT 4 — Results Dashboard

```
Read CLAUDE.md — Color System, brand voice, and the supplement/meal data structures from types/index.ts.

Build the complete results page at app/results/page.tsx:

1. Data loading: on mount, read 'replete_profile' from localStorage (set by IntakeWizard). If missing, redirect to /intake.

2. Results header: personalized title using their drug/duration/diet, risk tier badge, "Your [Drug] Nutrition Profile" heading.

3. Overall score display: large number showing overallScore (0–95), color-coded by risk tier (red/amber/green), description of what the score means. Animate the number counting up on mount.

4. Deficiency breakdown component (components/DeficiencyChart.tsx):
   - 8 nutrient rows sorted by score (highest first)
   - Each row: nutrient name, risk label (High Risk / Moderate / Low), animated fill bar
   - Bar colors: red gradient for high, amber for moderate, green for low
   - Bars animate from 0 to final value on mount using Framer Motion

5. Supplement stack (components/SupplementStack.tsx):
   - Priority-ordered cards (critical → high → support)
   - Each card: icon, name, priority badge (⚠ Critical / ↑ High / ✓ Support), dose with timing, form explanation, why it matters for GLP-1
   - Critical cards have subtle red left border, high cards amber, support green

6. Meal plan (components/MealPlan.tsx):
   - 3 days as expandable accordion sections
   - Each day: breakfast, lunch, dinner
   - Each meal: type label, meal name (bold), why note (muted, smaller)
   - "Microdose Meal Philosophy" explainer box above the days

7. Personalized insight box: 2–3 sentences explaining why this specific profile has these risks, using their actual drug/duration/dose values. Reference the clinical data (88–98% statistic).

8. CTA section at bottom: "This is your starting point" heading, description of what the full app does (adaptive plans, pharmacist-reviewed supplements, community), email capture form that POSTs to /api/waitlist.

Make the entire page feel premium — this is what converts a visitor into a waitlist signup and what a potential acquirer will see in a demo.
```

---

## PROMPT 5 — Marketing Landing Page

```
Read CLAUDE.md — the "Marketing Landing Page" section completely, plus the brand voice guidelines.

Build app/page.tsx as a conversion-optimized landing page:

1. Hero section:
   - Large headline: "GLP-1 is changing your body. Your nutrition plan hasn't kept up."
   - Sub: "88% of GLP-1 users are below optimal intake for 4+ key nutrients. Replete tells you exactly which ones — and what to do about it."
   - Primary CTA button → /intake
   - Background: subtle gradient from --bg to a slightly lighter navy
   - Animate headline in on load with Framer Motion

2. Stats strip (full-width dark card):
   - 88-98% — GLP-1 users below magnesium targets
   - 6+ — Key nutrients depleted by reduced intake
   - 0 — Consumer platforms addressing this gap
   - Source note: "(Frontiers in Nutrition, 2025 · Joint Advisory, ACLM/ASN/OMA)"

3. How It Works (3 steps with icons):
   - Answer 5 questions about your regimen
   - Receive your personalized deficiency risk profile
   - Follow your supplement + meal plan — adapts as you go
   - Clean card layout, numbered, icon per step

4. Credibility bar:
   - "Built on peer-reviewed research from:" followed by society names
   - Subtle, not oversold — earns trust, doesn't shout about it

5. Sample result preview:
   - Blurred/masked version of the DeficiencyChart showing bars
   - Caption: "Your actual results will show your specific risk profile"

6. Waitlist section:
   - Headline: "Be first when we launch the full agent."
   - Show signup count (start at "2,400+" — update this manually as it grows)
   - Email input + "Join Waitlist" button → POST to /api/waitlist
   - On success: show confirmation message with a teaser of what they'll receive

7. Footer: logo, tagline, legal disclaimer from CLAUDE.md, "Built on clinical nutrition research."

SEO: proper meta title, description, and og:image configuration.

The page must load fast — no heavy images, optimized for Core Web Vitals.
```

---

## PROMPT 6 — Waitlist API + Email Sequences

```
Read CLAUDE.md — the Email Sequences section.

1. Create app/api/waitlist/route.ts:
   - POST handler that accepts: { email: string, profile?: DeficiencyProfile, intakeData?: IntakeData }
   - Validate email format
   - Store to a local JSON file at data/waitlist.json (create directory) for MVP — append each signup with timestamp and profile data
   - Send welcome email via Resend (use RESEND_API_KEY from .env.local)
   - Return { success: true, count: number } where count is total signups

2. Create lib/email-sequences.ts with functions that return HTML email content for each step in CLAUDE.md:
   - welcomeEmail(profile: DeficiencyProfile, intake: IntakeData): string
   - day3Email(): string  — The protein problem
   - day7Email(): string  — Hair loss question
   - day14Email(profile: DeficiencyProfile): string  — Personalized supplement stack
   - day30Email(): string  — 30-day check-in

   Each email: clean HTML, matches brand colors (#080C14 background, #10B981 accents), mobile-optimized, unsubscribe link placeholder, Replete logo text in header.

3. Create .env.local.example with:
   RESEND_API_KEY=your_key_here
   NEXT_PUBLIC_APP_URL=http://localhost:3000

4. Create app/api/analyze/route.ts:
   - POST handler that accepts IntakeData
   - Runs calculateDeficiencies + getSupplementRecommendations + getMealPlan
   - Returns the complete profile
   - This is the API endpoint for future mobile app / third-party integration

5. Write a simple test script at scripts/test-email.ts that sends a test welcome email to a hardcoded address so I can verify the Resend integration works.

Document how to get a Resend API key (free tier: 3,000 emails/month) in a comment at the top of the route file.
```

---

## PROMPT 7 — Admin Dashboard

```
Build a simple internal admin dashboard at app/admin/page.tsx.

IMPORTANT: Password protect this page. Check for a query param ?key=ADMIN_KEY where ADMIN_KEY comes from process.env.ADMIN_KEY. If missing or wrong, show a 403 page. This is not for public access.

Dashboard displays — read from data/waitlist.json:

1. Summary cards (top row):
   - Total signups (large number)
   - Signups this week
   - Signups today
   - Average risk score across all profiles

2. Deficiency frequency chart (Recharts bar chart):
   - For each of the 8 nutrients: what % of signups have High Risk (>= 65) for that nutrient
   - This shows which deficiencies are most common in the user base

3. Drug distribution (Recharts pie chart):
   - % on semaglutide vs tirzepatide vs other

4. Duration distribution (bar chart):
   - How long users have been on GLP-1

5. Recent signups table:
   - Last 20 signups: timestamp, email (masked: jo***@gmail.com), risk tier, drug, duration
   - Sortable by timestamp

6. Export button: downloads waitlist.json as CSV

Style to match brand. This page is what you show in acquisition conversations — it demonstrates real user traction and data.
```

---

## PROMPT 8 — Reddit Content Generator

```
Build an internal tool at app/tools/reddit/page.tsx.

This tool generates ready-to-post Reddit content for r/Semaglutide, r/WegovyWeightLoss, r/Ozempic, and r/Mounjaro. It is for INTERNAL USE — the goal is to drive organic community-based acquisition by answering real questions helpfully.

Password protect with same ?key= approach as admin dashboard.

1. Template selector: dropdown with these question types (from CLAUDE.md Reddit strategy):
   - Fatigue on GLP-1
   - Hair loss / thinning
   - Supplement questions  
   - What to eat / meal ideas
   - Brain fog
   - General check-in / update post
   - Responding to "is this normal?" questions
   - Science explainer (deficiency education)

2. Context inputs:
   - User's drug (sema/tirz)
   - Duration
   - Specific symptom or question they're referencing
   - Include Replete mention? (toggle — default off, use sparingly)

3. Generated output:
   - Reddit-formatted post (markdown)
   - Conversational, community tone — NOT marketing language
   - Leads with genuine helpful information
   - If Replete toggle is on: mentions it as "a tool I found" not "our product"
   - Copy to clipboard button

4. Content library: store all generated posts in data/reddit-posts.json with timestamp and template type. Show history below generator.

The voice must sound like a knowledgeable community member, not a brand. If any output sounds like marketing copy, it will get downvoted and banned. Test every template type for authentic voice.
```

---

## AFTER PROMPT 8 — Deploy

```
The app is feature-complete for MVP. Now deploy:

1. Push to GitHub: initialize git, create .gitignore (exclude .env.local, data/*.json, node_modules), commit everything, push to new repo.

2. Deploy to Vercel:
   - Connect GitHub repo to Vercel
   - Set environment variables: RESEND_API_KEY, ADMIN_KEY, NEXT_PUBLIC_APP_URL
   - Deploy to production

3. Post-deploy checklist:
   - Test intake wizard end-to-end on mobile
   - Confirm waitlist signup sends email
   - Confirm admin dashboard loads
   - Check page speed score (target > 90 on mobile)
   - Verify all meta tags and og:image

4. Set up a custom domain if available. Suggested: replete.health or getyourplan.com or similar. Register via Namecheap or Cloudflare.

Report the production URL when done.
```

---

## NOTES FOR CLAUDE CODE

- Always read CLAUDE.md before starting any session
- Run `pnpm dev` after each prompt to verify nothing is broken
- If you hit an error you can't resolve in 2 attempts, document it clearly and move on — don't loop
- Commit working code after each prompt completes: `git add -A && git commit -m "Prompt N: [description]"`
- The deficiency algorithm in Prompt 2 is the highest-stakes code — test it thoroughly
- Potassium supplement recommendation is ALWAYS food-only — this is a safety constraint, not a preference
- Mobile-first on every component — Yosef demos this on his phone
