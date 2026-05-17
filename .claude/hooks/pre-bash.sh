#!/bin/bash
# Replete agent — PreToolUse hook for Bash.
# Reads the tool-call JSON on stdin, blocks dangerous patterns, logs high-risk
# commands. Exits non-zero only to block; treats everything else as allow.

set -e
HOOK_DATA=$(cat)
BASH_CMD=$(echo "$HOOK_DATA" | jq -r '.tool_input.command // empty' 2>/dev/null || echo "")

BLOCKED_PATTERNS=("rm -rf /" "git reset --hard" "git push --force" "DROP TABLE" "> /etc/")
for pattern in "${BLOCKED_PATTERNS[@]}"; do
  if echo "$BASH_CMD" | grep -qF "$pattern"; then
    echo "BLOCKED: dangerous pattern '$pattern'" >&2
    exit 2
  fi
done

# Log high-risk commands. Best-effort: silently swallow if .agent-session
# isn't present (e.g. hook invoked from a non-agent project).
if echo "$BASH_CMD" | grep -qE "git commit|git push|npm test|pnpm test"; then
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) | HIGH_RISK | $BASH_CMD" >> .agent-session/task-log.jsonl 2>/dev/null || true
fi
exit 0
