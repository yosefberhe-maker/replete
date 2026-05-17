#!/bin/bash
# Replete agent — PostToolUse hook for Write.
# When the agent writes a JSON file inside data/ or .agent-session/, validate
# the parse before allowing the session to continue. Logs every validated
# write to the audit trail.

HOOK_DATA=$(cat)
FILE_PATH=$(echo "$HOOK_DATA" | jq -r '.tool_input.file_path // empty' 2>/dev/null || echo "")

if [[ "$FILE_PATH" == *".json" ]] && [[ "$FILE_PATH" == *"data/"* || "$FILE_PATH" == *"agent-session"* ]]; then
  CONTENT=$(cat "$FILE_PATH" 2>/dev/null || echo "")
  if [ -n "$CONTENT" ] && ! echo "$CONTENT" | jq empty 2>/dev/null; then
    echo "ERROR: Invalid JSON written to $FILE_PATH" >&2
    exit 1
  fi
  echo "$(date -u +%Y-%m-%dT%H:%M:%SZ) | WRITE_VALIDATED | $FILE_PATH" >> .agent-session/task-log.jsonl 2>/dev/null || true
fi
exit 0
