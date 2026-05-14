# Start Here — Replete Build Instructions

## On your Mac mini, open Terminal and run:

```bash
# 1. Go to this folder
cd ~/Desktop/replete

# 2. Start Claude Code
claude

# 3. Claude Code will read CLAUDE.md automatically.
#    Now paste Prompt 1 from PROMPTS.md and let it run.
#    Each prompt takes 5–15 minutes to complete.
#    Work through all 8 prompts in order.
```

## File map:
- CLAUDE.md     — Full product spec, algorithm, brand, copy. Claude Code reads this.
- PROMPTS.md    — 8 build prompts to run in sequence. Paste one at a time.
- START_HERE.md — This file.

## After each prompt completes:
Claude Code will commit the code. You can check what it built by running `pnpm dev`
and opening http://localhost:3000 in your browser.

## Total estimated time: 2–3 hours of autonomous Claude Code execution.
## You should only need to paste 8 prompts. It does the rest.
