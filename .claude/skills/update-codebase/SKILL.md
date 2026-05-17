---
name: update-codebase
description: Apply verified clinical findings to supplement-data.ts and deficiency-engine.ts
---
# Update Codebase Skill

## When to use
After `validate-claims` has produced `VERIFIED` entries in `.agent-session/validated-claims.json` and the operator (or sub-agent) is ready to translate those findings into code.

## Hard preconditions
- A populated `.agent-session/validated-claims.json` with at least one entry at status `VERIFIED`.
- Every claim has a valid PMID in its `source` field — no PMID, no write.
- Tests are currently green before any edit begins (`pnpm test`).

## Steps
1. For each `VERIFIED` claim:
   - Locate the corresponding nutrient/supplement in `lib/supplement-data.ts` or `lib/deficiency-engine.ts`.
   - If the claim *supersedes* an existing claim, record the superseded PMID in `.agent-session/claim-registry.json` under `superseded_by`.
   - Update the `why`, `dose`, `caution`, or `safetyNote` field. Do not touch numerical thresholds unless the claim's evidence quality is grade A (RCT, meta-analysis, or n > 1,000).
2. Re-run `pnpm test`. Any failure rolls everything back via `git checkout .`.
3. Stage and commit only the files you edited. Commit message MUST include the PMID(s) you sourced from.
4. Append the action to `.agent-session/task-log.jsonl`.

## Safety Rule
NEVER modify `__tests__/` from this skill. NEVER bypass the test gate. If `pnpm test` fails twice in a row on the same edit, escalate to operator.
