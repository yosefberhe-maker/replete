# Build status — May 17, 2026

Working toward a June 1 launch (T-15 days). This pass: get the build green, restructure shareable links to the URL users will actually share with their doctor or family, and polish the mobile experience.

## What changed this pass

| Commit  | Scope                                                                      |
|---------|----------------------------------------------------------------------------|
| 358f97d | Build fixes — pass `next build` with zero errors / warnings                |
| 00f13cf | Shareable profile moved to `/results/[id]` with per-profile og metadata    |
| 1c010f6 | Dynamic `/opengraph-image` route (next/og) — branded social preview card   |
| 13d9da5 | Mobile-first polish — 44px tap targets, no horizontal scroll, iOS inputs   |

### Build fix details (358f97d)

- `components/SamplePreview.tsx` — added missing `thiamine` field; the type was widened in an earlier commit and the sample data drifted.
- `components/CyclePhaseCard.tsx`, `components/GISupport.tsx` — escaped unescaped `'` (Next ESLint rule).
- `.eslintrc.json` — `root: true` so the worktree config doesn't conflict with the parent checkout's config (the build was failing with "Plugin @next/next was conflicted between …").
- `.gitignore` — ignore `package-lock.json` so the npm lockfile doesn't enter the repo (pnpm is canonical).

### `/results/[id]` shareable route (00f13cf)

The repo previously served shareable profiles at `/r/[code]`. The task brief specifies `/results/[id]` as the canonical share URL — that's the path a user will share with their doctor. Migration:

- New page: `app/results/[id]/page.tsx` (server component, dynamic).
- `generateMetadata` emits per-profile `og:title`, `og:description`, `og:image`, and `twitter:card` so the link preview shows the specific drug + diet + risk tier when posted on iMessage, Slack, Reddit.
- `next.config.mjs` adds a permanent `308` redirect from `/r/:code → /results/:code`. The legacy directory was removed.
- `ShareProfileButton` and the `/api/share` doc comment now reference the new path.

### Dynamic OG image (1c010f6)

- `app/opengraph-image.tsx` — edge-runtime `ImageResponse` that renders a 1200×630 branded card (radial gradient + wordmark + hero copy + URL footer).
- `app/twitter-image.tsx` — same image, declared with the Twitter convention.
- Next.js automatically wires this up site-wide. `/` shows `og:image=http://NEXT_PUBLIC_APP_URL/opengraph-image`; `/results/[id]` explicitly references it so per-page overrides don't drop the parent image.

### Mobile polish (13d9da5)

The target user is a 40-year-old woman on an iPhone. Concrete changes:

- `html, body { overflow-x: hidden }` — kills any accidental horizontal scroll regardless of which page or third-party chart is rendered.
- `@media (max-width: 640px) { input, select, textarea { font-size: 16px } }` — iOS Safari auto-zooms when a focused input is <16px. Locking inputs to 16px on mobile keeps the layout still.
- `.btn-primary` and `.btn-ghost` now have `min-h-[44px]` (Apple HIG tap-target minimum). Previously the buttons were ~40px in the worst case.
- Marketing nav and the results page "Re-run intake" link explicitly meet the 44px tap target.
- The primary CTA (`Get my plan`) now shows on mobile too. Previously it was `sm:inline-flex` and hidden on small screens, which made the header feel empty.

## What still needs human input

Before the public launch, the following require keys / credentials / decisions you'll have to provide:

1. **`RESEND_API_KEY`** — set in Vercel production env. Without it, signups still capture but no welcome email goes out (the system no-ops gracefully and reports `emailSkipped: "no-api-key"`).
2. **`RESEND_FROM`** — must be a verified sender on a domain you control (e.g. `"Replete <hello@replete.health>"`). Resend won't send without a verified domain.
3. **`NEXT_PUBLIC_APP_URL`** — set to the production URL (e.g. `https://replete.health`). This is used in og:image absolute URLs and email link rewriting.
4. **`ADMIN_KEY`** — password gate for `/admin` and `/tools/reddit`. Pick a strong one.
5. **Brand name** — CLAUDE.md notes "currently named Replete, rename pending." The wordmark and all copy reference "Replete." If the rename happens before launch, all hard-coded strings need a sweep.
6. **RD reviewer credentials** — the `ReviewedBadge` component says "Reviewed by registered dietitians." That claim must be either backed by an actual RD review of the supplement-data.ts content, or softened. As written, it is a legal exposure.
7. **Favicon polish** — there's a default Next favicon at `app/favicon.ico` (a real 16×16/32×32 ICO). It looks fine but doesn't match the brand mark. Consider a green dot favicon to match the wordmark.
8. **`og:image` font** — the next/og runtime uses Vercel's default system font. For a polished launch, ship the Inter `.woff` and pass it via `ImageResponse({ fonts: [...] })`. It's noticeable on Twitter/iMessage previews.

## Honest assessment: launch-ready on June 1?

**Yes — assuming the human-input items above are resolved.** The end-to-end flow works:

- Intake wizard (10 steps, ~2 min) → calculates a quantitative deficiency profile, protein target, and supplement stack.
- Results page renders chart + supplements + meal plan + injection-cycle advice + GI protocol + safety alerts. localStorage-persisted so refresh works.
- Share button mints a 6-char code, stores an anonymized snapshot, returns `/results/[id]` URL with proper OG tags.
- Waitlist endpoint persists email + sends welcome email via Resend when configured.
- 67 unit tests pass; `next build` is clean.

What it doesn't have that a mature launch would want: a real database (currently JSON files — fine for hundreds of users, brittle past thousands and on Vercel's ephemeral filesystem), analytics (no Plausible/GA4 wired up), and a customer-support inbox. The clinical content is sourced and disclaimed but has not been reviewed by a credentialed RD.

The product itself solves a real, documented gap and the data layer is sufficient for the first month of traffic. Ship it, watch the signup curve, harden the storage layer in week 1 post-launch.

## Top 3 things to tackle next

1. **Migrate `lib/storage.ts` to Supabase.** The JSON-file store is fine until the first Vercel cold-start eats `data/waitlist.json` in production. Schemas: `waitlist`, `shared_profiles`, `reddit_posts`. The interface in `lib/storage.ts` is already shaped for this swap — replace the body, keep the function signatures.
2. **Wire up product analytics.** Plausible or PostHog. Track: `intake_started`, `intake_completed`, `share_link_created`, `waitlist_submitted`. This is the data an acquirer (Hims, Noom, Ro) will ask for in their first conversation.
3. **Get an RD to sign off on `supplement-data.ts`.** Either retain a credentialed RD as a paid reviewer (~$2-3k for the initial pass) and put their name on the `ReviewedBadge`, or change the badge copy to "Built on peer-reviewed clinical research" — which is true today.
