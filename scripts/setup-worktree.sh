#!/bin/bash
# Create an isolated git worktree for the agent so research/edit cycles
# can't disturb the main checkout. Branch name auto-stamped with the
# timestamp; pass a custom name as $1 to override.
#
# Usage: bash scripts/setup-worktree.sh [worktree-name]

set -euo pipefail

WORKTREE_NAME="${1:-agent-$(date -u +%Y%m%dT%H%M%SZ)}"
REPO_ROOT="$(git rev-parse --show-toplevel)"
WORKTREE_DIR="$REPO_ROOT/.agent-worktrees/$WORKTREE_NAME"
BRANCH_NAME="agent/$WORKTREE_NAME"

mkdir -p "$REPO_ROOT/.agent-worktrees"

if [ -d "$WORKTREE_DIR" ]; then
  echo "ERROR: Worktree already exists at $WORKTREE_DIR" >&2
  exit 1
fi

git -C "$REPO_ROOT" worktree add -b "$BRANCH_NAME" "$WORKTREE_DIR" HEAD

echo ""
echo "Worktree created."
echo "  Path:   $WORKTREE_DIR"
echo "  Branch: $BRANCH_NAME"
echo ""
echo "To enter:   cd $WORKTREE_DIR"
echo "To remove:  git worktree remove $WORKTREE_DIR"
