---
name: validate-claims
description: Validate health claims from research papers against codebase data
---
# Validate Claims Skill

## When to use
After researching papers, before writing any updates to `supplement-data.ts` or `deficiency-engine.ts`.

## Steps
1. Run: `bash scripts/validate-claims.sh .agent-session/new-papers.json .agent-session/validated-claims.json`
2. Review `validated-claims.json` for `RELEVANT` papers
3. For each `RELEVANT` paper: check if it supports or contradicts current data
4. Only `VERIFIED` claims may be written to the codebase

## Safety Rule
NEVER write a claim to the codebase without a valid PMID in the source field.
