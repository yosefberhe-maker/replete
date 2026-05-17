#!/bin/bash
# Search PubMed E-utils API for new GLP-1 nutrition papers.
# Usage: bash research-pubmed.sh <output-file>

set -e

OUTPUT="${1:-.agent-session/new-papers.json}"
SEARCH_TERMS="(GLP-1+receptor+agonist+OR+glucagon-like+peptide+OR+semaglutide+OR+tirzepatide+OR+liraglutide)+AND+(nutrition+OR+supplement+OR+deficiency+OR+lean+mass+OR+lean+tissue+OR+muscle+mass+OR+sarcopenia)"
MIN_DATE="$(date -d '90 days ago' +%Y/%m/%d 2>/dev/null || date -v-90d +%Y/%m/%d)"  # 90-day lookback
BASE_URL="https://eutils.ncbi.nlm.nih.gov/entrez/eutils"

mkdir -p "$(dirname "$OUTPUT")"

echo "Searching PubMed: $SEARCH_TERMS (last 90 days, since $MIN_DATE)..."

# Step 1: Search for paper IDs
SEARCH_RESULT=$(curl -s "${BASE_URL}/esearch.fcgi?db=pubmed&term=${SEARCH_TERMS}&mindate=${MIN_DATE}&retmax=20&retmode=json" || echo "")
IDS=$(echo "$SEARCH_RESULT" | jq -r '.esearchresult.idlist[]' 2>/dev/null | tr '\n' ',' || echo "")

if [ -z "$IDS" ] || [ "$IDS" = "," ]; then
  echo "[]" > "$OUTPUT"
  echo "No new papers found"
  exit 0
fi

# Step 2: Fetch paper details — write XML to /tmp so the Python parser
# below can read it. This is the file the script previously expected but
# never created.
curl -s "${BASE_URL}/efetch.fcgi?db=pubmed&id=${IDS%,}&retmode=xml" > /tmp/pubmed-result.xml

# Step 3: Convert XML → JSON.
OUTPUT="$OUTPUT" python3 - << 'PYEOF'
import os, json, datetime, xml.etree.ElementTree as ET

output_file = os.environ.get("OUTPUT", ".agent-session/new-papers.json")

try:
    with open("/tmp/pubmed-result.xml") as fh:
        xml_data = fh.read()
except FileNotFoundError:
    xml_data = "<?xml version='1.0'?><PubmedArticleSet></PubmedArticleSet>"

papers = []
try:
    root = ET.fromstring(xml_data)
    for article in root.findall(".//PubmedArticle"):
        pmid = article.findtext(".//PMID", "") or ""
        title = article.findtext(".//ArticleTitle", "") or ""
        abstract = article.findtext(".//AbstractText", "") or ""
        year = article.findtext(".//PubDate/Year", "2025") or "2025"
        papers.append({
            "pmid": pmid,
            "title": title,
            "abstract": abstract[:500],
            "year": year,
            "status": "PENDING",
            "retrieved_at": datetime.datetime.utcnow().isoformat() + "Z",
        })
except ET.ParseError as exc:
    print(f"XML parse error: {exc}")

with open(output_file, "w") as fh:
    json.dump(papers, fh, indent=2)

print(f"Wrote {len(papers)} papers to {output_file}")
PYEOF
