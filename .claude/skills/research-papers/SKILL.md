---
name: research-papers
description: Search PubMed for new GLP-1 clinical studies and extract nutrition findings
---
# Research Papers Skill

## When to use
When you need to find new peer-reviewed papers on GLP-1 nutrition, deficiencies, supplement protocols, or related clinical outcomes.

## Steps
1. Run: `bash scripts/research-pubmed.sh .agent-session/new-papers.json`
2. Review output JSON for relevant findings
3. Cross-reference against existing claims in `lib/supplement-data.ts`
4. Flag any papers that contradict current app data

## Output
JSON array at `.agent-session/new-papers.json` with `pmid`, `title`, `abstract`, `year`, `status` fields.
