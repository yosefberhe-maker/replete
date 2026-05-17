#!/bin/bash
# Replete agent — Stop hook.
# If the agent has uncommitted changes but tests haven't passed, surface a
# warning. Intentionally non-blocking — exit 0 — so the operator decides
# whether to override.

HOOK_DATA=$(cat)
# No changes at all? Always safe to stop.
if git -C . diff --cached --quiet 2>/dev/null && git -C . diff --quiet 2>/dev/null; then
  exit 0
fi

if [ ! -f ".agent-session/tests.passed" ]; then
  echo "WARNING: Agent has uncommitted changes but tests haven't passed yet." >&2
  echo "Run pnpm test before stopping, or discard changes with git checkout ." >&2
fi
exit 0
