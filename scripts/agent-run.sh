#!/bin/bash
# Main agent entry point.
# Usage: bash scripts/agent-run.sh [--dry-run]

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SESSION_DIR="$REPO_ROOT/.agent-session"
LOG="$SESSION_DIR/task-log.jsonl"
DRY_RUN="${1:-}"

mkdir -p "$SESSION_DIR"

echo "{\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"event\":\"AGENT_START\",\"dry_run\":\"$DRY_RUN\"}" >> "$LOG"

echo "=== Replete Autonomous Research Agent ==="
echo "Session: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo ""

# Phase 1: Research new papers
echo "[1/4] Searching PubMed for new GLP-1 research..."
bash "$REPO_ROOT/scripts/research-pubmed.sh" "$SESSION_DIR/new-papers.json"

PAPER_COUNT=$(jq 'length' "$SESSION_DIR/new-papers.json" 2>/dev/null || echo 0)
echo "Found $PAPER_COUNT papers to review"

# Phase 2: Validate claims
echo "[2/4] Validating claims against codebase..."
bash "$REPO_ROOT/scripts/validate-claims.sh" \
  "$SESSION_DIR/new-papers.json" \
  "$SESSION_DIR/validated-claims.json"

# Phase 3: Run tests
echo "[3/4] Running test suite..."
cd "$REPO_ROOT"
if pnpm test --passWithNoTests 2>&1 | tee "$SESSION_DIR/test-results.log"; then
  touch "$SESSION_DIR/tests.passed"
  echo "Tests PASSED"
else
  rm -f "$SESSION_DIR/tests.passed"
  echo "Tests FAILED — agent will not commit"
  echo "{\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"event\":\"TESTS_FAILED\"}" >> "$LOG"
  exit 1
fi

# Phase 4: Report
echo "[4/4] Generating research summary..."
VERIFIED=$(jq '[.[] | select(.status=="VERIFIED")] | length' "$SESSION_DIR/validated-claims.json" 2>/dev/null || echo 0)
REJECTED=$(jq '[.[] | select(.status=="REJECTED")] | length' "$SESSION_DIR/validated-claims.json" 2>/dev/null || echo 0)

echo ""
echo "=== Agent Run Complete ==="
echo "Papers reviewed: $PAPER_COUNT"
echo "Claims verified: $VERIFIED"
echo "Claims rejected: $REJECTED"

echo "{\"timestamp\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"event\":\"AGENT_COMPLETE\",\"papers\":$PAPER_COUNT,\"verified\":$VERIFIED,\"rejected\":$REJECTED}" >> "$LOG"
