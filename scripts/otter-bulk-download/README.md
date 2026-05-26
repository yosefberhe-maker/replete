# Otter.ai Bulk Transcript Downloader

Pull **every** transcript you can access from the Otter.ai Enterprise API in one
run, save them in a clean folder tree, and re-run weekly without re-downloading
what you already have.

```
output/
  2026-05/
    abc123_quarterly-planning/
      transcript.txt
      summary.txt        # only if Otter returns one
      metadata.json
      audio.mp3          # only with --include-audio
  manifest.csv           # every transcript + status, at the output root
  errors.log             # timestamped per-transcript failures
```

## Setup

Requires **Python 3.10+**.

```bash
cd scripts/otter-bulk-download
python -m venv .venv && source .venv/bin/activate   # optional but recommended
pip install -r requirements.txt

cp .env.example .env
# then edit .env and set OTTER_API_KEY
```

`.env` keys:

| Variable             | Required | Purpose                                                        |
|----------------------|----------|----------------------------------------------------------------|
| `OTTER_API_KEY`      | yes      | Your bearer token / API key (read only from `.env`)            |
| `OTTER_BASE_URL`     | no       | Defaults to `https://api.otter.ai/v1`                          |
| `OTTER_WORKSPACE_ID` | no       | Set only if your tenant scopes conversations under a workspace |

Credentials are **only** read from `.env` — never hardcoded, never written to
disk or logs.

## Usage

```bash
# Download everything (transcripts + summaries + metadata, no audio)
python otter_bulk_download.py

# First-time smoke test: just grab 3 and inspect the output
python otter_bulk_download.py --max 3 --debug

# Date range + a specific folder, including audio
python otter_bulk_download.py \
    --start-date 2026-01-01 --end-date 2026-03-31 \
    --folder-id 12345 --include-audio

# Weekly re-run: already-downloaded transcripts are skipped automatically
python otter_bulk_download.py --start-date 2026-05-01
```

### Flags

| Flag               | Default  | Description                                                     |
|--------------------|----------|-----------------------------------------------------------------|
| `--output`         | `output` | Root output directory                                           |
| `--start-date`     | –        | Only transcripts on/after this date (`YYYY-MM-DD`)              |
| `--end-date`       | –        | Only transcripts on/before this date (`YYYY-MM-DD`)            |
| `--folder-id`      | –        | Restrict to a folder id                                         |
| `--group-id`       | –        | Restrict to a group id                                          |
| `--speaker`        | –        | Restrict to transcripts featuring this speaker                  |
| `--include-audio`  | off      | Also download `audio.mp3`                                       |
| `--force`          | off      | Re-download even if the transcript folder already exists        |
| `--workers`        | `5`      | Parallel download workers                                       |
| `--page-size`      | `50`     | Page size for the list endpoint                                 |
| `--max`            | `0`      | Process at most N transcripts (0 = no limit). Great for testing |
| `--base-url`       | –        | Override `OTTER_BASE_URL`                                       |
| `--workspace-id`   | –        | Override `OTTER_WORKSPACE_ID`                                   |
| `--debug`          | off      | Print the raw first list/detail response, then keep going       |

## How it works

1. **List + paginate.** Calls the conversations list endpoint and pages through
   *all* results. Pagination is **auto-detected** — cursor (Otter's documented
   scheme), `next_url`, page-number, and offset/limit are all handled.
2. **Per transcript.** Writes `transcript.txt`, `summary.txt` (if present),
   `metadata.json`, and optionally `audio.mp3`. If the list response is
   metadata-only, it fetches the per-conversation detail/transcript automatically.
3. **Idempotency.** Before downloading it checks whether an `{otter_id}_*` folder
   already exists and **skips** it unless `--force` is passed.
4. **Resilience.** Exponential backoff on `429`/`5xx` (max 5 retries, honors
   `Retry-After`); per-transcript failures are logged to `errors.log` and the
   job continues.
5. **Performance.** `ThreadPoolExecutor` with 5 workers (configurable).
6. **Output.** Prints `[i/N] {title} -> status` progress and a final summary;
   writes `manifest.csv` listing every transcript with its local path + status.

## Important: verify the API shape for your tenant

The Otter Enterprise API varies by plan/version. This script is grounded in
Otter's public documentation but **does not assume** your exact schema — every
API-specific value lives in the **`CONFIG` block at the top of
`otter_bulk_download.py`**:

- endpoint paths (`ENDPOINTS`)
- pagination param names (`PAGE_SIZE_PARAM`, `CURSOR_PARAM`)
- filter query-param names (`FILTER_PARAMS`)
- response field names (`FIELD_CANDIDATES`, `LIST_CONTAINER_KEYS`, …)

If a call 404s or a file comes out empty:

1. Run with `--debug` to dump the raw first list/detail response.
2. Compare the field names you see to `FIELD_CANDIDATES` / `LIST_CONTAINER_KEYS`
   and add/adjust as needed (the extractor tries each candidate in order).
3. Fix the relevant endpoint path in `ENDPOINTS` if needed.

Field extraction is defensive (it tries many common names), and date/speaker
filters are also enforced **client-side**, so small schema differences degrade
gracefully rather than producing wrong data.

## Safety notes

- Potassium and other clinical content are unrelated to this tool — this is a
  pure data-export utility.
- The API key is sensitive. Keep `.env` out of version control (add it to
  `.gitignore`). If a key is ever exposed, rotate it in the Otter admin console.
