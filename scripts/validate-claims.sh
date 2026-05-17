#!/bin/bash
# Cross-check new papers against existing codebase claims.
# Usage: bash validate-claims.sh <papers-json> <output-json>

set -e

PAPERS="${1:-.agent-session/new-papers.json}"
OUTPUT="${2:-.agent-session/validated-claims.json}"

mkdir -p "$(dirname "$OUTPUT")"

PAPERS="$PAPERS" OUTPUT="$OUTPUT" python3 - << 'PYEOF'
import os, json, datetime

papers_path = os.environ["PAPERS"]
output_path = os.environ["OUTPUT"]

try:
    with open(papers_path) as fh:
        papers = json.load(fh)
except FileNotFoundError:
    papers = []

# Keywords aligned to Replete's tracked nutrients + lean-mass framing.
existing_keywords = [
    "vitamin d", "iron", "magnesium", "protein", "potassium", "choline",
    "thiamine", "b12", "calcium", "fiber", "zinc", "lean mass",
]

results = []
for paper in papers:
    abstract = (paper.get("abstract") or "").lower()
    title = (paper.get("title") or "").lower()
    matched = [kw for kw in existing_keywords if kw in abstract or kw in title]
    results.append({
        "pmid": paper.get("pmid", ""),
        "title": paper.get("title", ""),
        "year": paper.get("year", ""),
        "status": "RELEVANT" if matched else "NOT_RELEVANT",
        "matched_nutrients": matched,
        "requires_human_review": len(matched) > 0,
        "validated_at": datetime.datetime.utcnow().isoformat() + "Z",
    })

with open(output_path, "w") as fh:
    json.dump(results, fh, indent=2)

relevant = sum(1 for r in results if r["status"] == "RELEVANT")
print(f"Validated {len(results)} papers: {relevant} relevant to Replete")
PYEOF
