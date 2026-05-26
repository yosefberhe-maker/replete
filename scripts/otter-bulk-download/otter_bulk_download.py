#!/usr/bin/env python3
"""
Otter.ai Enterprise — bulk transcript downloader.

Pulls every transcript you can access, saves them in a clean folder tree, and is
safe to re-run: anything already downloaded is skipped unless --force is passed.

    output/
      YYYY-MM/
        {otter_id}_{slugified_title}/
          transcript.txt
          summary.txt        (only if Otter returns one)
          metadata.json
          audio.mp3          (only with --include-audio)
      manifest.csv
      errors.log

Credentials come from a .env file only (never hardcoded, never logged):

    OTTER_API_KEY   = your bearer token / API key
    OTTER_BASE_URL  = https://api.otter.ai/v1        (optional override)
    OTTER_WORKSPACE_ID = ...                          (optional, if tenant-scoped)

------------------------------------------------------------------------------
!!  READ THIS BEFORE FIRST RUN  !!
The Otter Enterprise API shape varies by plan/version. Everything API-specific
lives in the CONFIG block below (endpoint paths, query-param names, response
field names). The values are grounded in Otter's public docs but NOT guaranteed
for your tenant. If a call 404s or a file comes out empty:
  1. Run with --debug to print the raw first list/detail response.
  2. Adjust the matching constant in CONFIG. Pagination, field extraction and
     filters are all driven from there — usually a one-line fix.
The pagination handler AUTO-DETECTS cursor / next_url / page-number / offset
styles, so it should work even if your tenant differs from the documented one.
------------------------------------------------------------------------------
"""

from __future__ import annotations

import argparse
import csv
import json
import logging
import os
import random
import re
import sys
import threading
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, date, timezone
from pathlib import Path
from typing import Any, Iterable, Iterator, Optional

import requests
from dotenv import load_dotenv

try:
    from tqdm import tqdm
except ImportError:  # tqdm is a hard dep, but degrade gracefully rather than crash
    def tqdm(iterable=None, **_kwargs):
        return iterable if iterable is not None else []
    tqdm.write = lambda msg, **_k: print(msg)  # type: ignore[attr-defined]


# =============================================================================
# CONFIG  —  the only Otter-specific knobs. Verify against YOUR API docs.
# =============================================================================

DEFAULT_BASE_URL = "https://api.otter.ai/v1"

# Endpoint path templates (joined onto the base URL). {id} is filled per
# conversation; {workspace_id} is filled only when OTTER_WORKSPACE_ID is set.
ENDPOINTS = {
    # Paginated list of conversations.
    "list": "/conversations",
    # Workspace-scoped list used instead of "list" when a workspace id is given.
    "list_workspace": "/workspace/{workspace_id}/conversations",
    # Single conversation; often already contains text/summary/speakers.
    "detail": "/conversations/{id}",
    # Full transcript text — only fetched if "detail" didn't include it.
    "transcript": "/conversations/{id}/transcript",
    # Audio — only fetched with --include-audio. May return binary OR JSON {url}.
    "audio": "/conversations/{id}/audio",
}

# Pagination (cursor-based per Otter docs; other schemes auto-detected below).
PAGE_SIZE_PARAM = "limit"
CURSOR_PARAM = "cursor"
DEFAULT_PAGE_SIZE = 50

# Query-param NAMES the list endpoint expects for each filter. Filters are also
# enforced client-side (by created date / speaker) as a safety net, so a wrong
# name here degrades gracefully instead of returning wrong data.
FILTER_PARAMS = {
    "start_date": "start_date",
    "end_date": "end_date",
    "folder_id": "folder_id",
    "group_id": "group_id",
    "speaker": "speaker",
}
# How dates are sent to the API: "date" -> YYYY-MM-DD, "epoch" -> unix seconds.
FILTER_DATE_FORMAT = "date"

# Where the list response hides the array of conversations + pagination meta.
LIST_CONTAINER_KEYS = ["conversations", "speeches", "data", "results", "items"]
META_KEYS = ["meta", "pagination", "paging"]
NEXT_CURSOR_KEYS = ["next_cursor", "end_cursor", "cursor", "next"]
HAS_MORE_KEYS = ["has_more", "hasMore", "more"]
NEXT_URL_KEYS = ["next_url", "next", "next_page_url"]

# Candidate field names per logical field (first present wins).
FIELD_CANDIDATES = {
    "id": ["id", "otid", "otter_id", "conversation_id", "speech_id", "uuid"],
    "title": ["title", "name", "topic", "subject"],
    "created": ["created_at", "created", "start_time", "started_at", "date",
                "time_created", "timestamp", "start"],
    "duration": ["duration", "duration_seconds", "length", "audio_length",
                 "speech_length"],
    "speakers": ["speakers", "speaker_names", "participants", "attendees"],
    "summary": ["summary", "abstract_summary", "auto_summary", "gist",
                "overview", "takeaways"],
    "text": ["transcript", "transcript_text", "text", "plain_text", "body",
             "content"],
    "audio_url": ["audio_url", "audio", "download_url", "media_url", "mp3_url"],
    "folder": ["folder", "folder_name", "folder_id"],
    "url": ["url", "permalink", "share_url", "public_url", "web_url"],
    # Used to assemble transcript text from utterance arrays when no flat text.
    "utterances": ["utterances", "transcripts", "segments", "monologues"],
}

# Retry policy for 429 / 5xx.
MAX_RETRIES = 5
BACKOFF_BASE_SECONDS = 2.0

# =============================================================================
# End CONFIG
# =============================================================================


log = logging.getLogger("otter")
_thread_local = threading.local()
_AUTH_HEADERS: dict[str, str] = {}
_DEBUG_PRINTED = threading.Event()  # so --debug only dumps the first response


# ----------------------------------------------------------------------------
# Small helpers
# ----------------------------------------------------------------------------

def first_present(obj: dict, candidates: list[str], default: Any = None) -> Any:
    """Return obj[k] for the first candidate key that exists with a non-null value."""
    if not isinstance(obj, dict):
        return default
    for key in candidates:
        if key in obj and obj[key] not in (None, ""):
            return obj[key]
    return default


def field(obj: dict, logical_name: str, default: Any = None) -> Any:
    return first_present(obj, FIELD_CANDIDATES.get(logical_name, []), default)


def slugify(value: str, max_len: int = 60) -> str:
    value = (value or "untitled").strip().lower()
    value = re.sub(r"[^\w\s-]", "", value)
    value = re.sub(r"[\s_-]+", "-", value).strip("-")
    return (value[:max_len].rstrip("-")) or "untitled"


def parse_datetime(value: Any) -> Optional[datetime]:
    """Best-effort parse of epoch (s or ms) or ISO-8601 into an aware datetime."""
    if value in (None, ""):
        return None
    if isinstance(value, (int, float)):
        ts = float(value)
        if ts > 1e12:  # milliseconds
            ts /= 1000.0
        try:
            return datetime.fromtimestamp(ts, tz=timezone.utc)
        except (OverflowError, OSError, ValueError):
            return None
    if isinstance(value, str):
        s = value.strip()
        if s.isdigit():
            return parse_datetime(int(s))
        try:
            return datetime.fromisoformat(s.replace("Z", "+00:00"))
        except ValueError:
            for fmt in ("%Y-%m-%dT%H:%M:%S", "%Y-%m-%d %H:%M:%S", "%Y-%m-%d"):
                try:
                    return datetime.strptime(s, fmt).replace(tzinfo=timezone.utc)
                except ValueError:
                    continue
    return None


def month_dir(created: Any) -> str:
    dt = parse_datetime(created)
    return dt.strftime("%Y-%m") if dt else "unknown-date"


def normalize_speakers(raw: Any) -> list[str]:
    if raw is None:
        return []
    if isinstance(raw, str):
        return [raw]
    out: list[str] = []
    if isinstance(raw, list):
        for item in raw:
            if isinstance(item, str):
                out.append(item)
            elif isinstance(item, dict):
                name = first_present(item, ["name", "speaker_name", "display_name",
                                            "full_name", "label", "id"])
                if name:
                    out.append(str(name))
    return out


def utterances_to_text(utterances: Any) -> str:
    """Render a speaker-attributed transcript from an utterance/segment array."""
    if not isinstance(utterances, list):
        return ""
    lines: list[str] = []
    for u in utterances:
        if not isinstance(u, dict):
            continue
        speaker = first_present(u, ["speaker", "speaker_name", "speaker_id", "name"])
        text = first_present(u, ["text", "transcript", "content", "words"], "")
        if isinstance(text, list):  # some APIs return word objects
            text = " ".join(
                w.get("word", "") if isinstance(w, dict) else str(w) for w in text
            ).strip()
        if not text:
            continue
        lines.append(f"{speaker}: {text}" if speaker else str(text))
    return "\n".join(lines)


# ----------------------------------------------------------------------------
# HTTP with retry/backoff
# ----------------------------------------------------------------------------

def get_session() -> requests.Session:
    s = getattr(_thread_local, "session", None)
    if s is None:
        s = requests.Session()
        s.headers.update(_AUTH_HEADERS)
        _thread_local.session = s
    return s


def request_with_retry(method: str, url: str, **kwargs) -> requests.Response:
    """GET/POST with exponential backoff on 429 and 5xx (max MAX_RETRIES)."""
    kwargs.setdefault("timeout", 60)
    session = get_session()
    last_exc: Optional[Exception] = None

    for attempt in range(MAX_RETRIES + 1):
        try:
            resp = session.request(method, url, **kwargs)
        except requests.RequestException as exc:
            last_exc = exc
            if attempt == MAX_RETRIES:
                raise
            time.sleep(_backoff(attempt))
            continue

        if resp.status_code == 429 or 500 <= resp.status_code < 600:
            if attempt == MAX_RETRIES:
                return resp  # let caller raise_for_status with full context
            retry_after = resp.headers.get("Retry-After")
            delay = float(retry_after) if (retry_after and retry_after.isdigit()) \
                else _backoff(attempt)
            time.sleep(delay)
            continue

        return resp

    if last_exc:
        raise last_exc
    raise RuntimeError(f"Request to {url} failed after {MAX_RETRIES} retries")


def _backoff(attempt: int) -> float:
    return BACKOFF_BASE_SECONDS * (2 ** attempt) + random.uniform(0, 1)


def get_json(url: str, params: Optional[dict] = None) -> Any:
    resp = request_with_retry("GET", url, params=params)
    resp.raise_for_status()
    return resp.json()


# ----------------------------------------------------------------------------
# Listing + pagination (auto-detecting)
# ----------------------------------------------------------------------------

def extract_list_and_next(payload: Any) -> tuple[list, Optional[str], Optional[dict]]:
    """Return (items, next_url, meta) from a list response of any common shape."""
    if isinstance(payload, list):
        return payload, None, None
    if not isinstance(payload, dict):
        return [], None, None

    items: list = []
    for key in LIST_CONTAINER_KEYS:
        if isinstance(payload.get(key), list):
            items = payload[key]
            break

    meta = None
    for key in META_KEYS:
        if isinstance(payload.get(key), dict):
            meta = payload[key]
            break

    next_url = first_present(payload, NEXT_URL_KEYS)
    # "next"/"next_url" must look like a URL to be treated as one.
    if isinstance(next_url, str) and not next_url.startswith("http"):
        next_url = None

    return items, next_url, meta


def iter_list_pages(base_url: str, list_url: str, params: dict,
                    debug: bool = False) -> Iterator[dict]:
    """Yield each conversation dict, paging through cursor / next_url / page styles.

    The pagination scheme is detected on the first page and then locked in, so a
    "full" final page can't accidentally re-trigger the page-number fallback
    after cursor/next_url pagination has already finished.
    """
    params = dict(params)
    page_num = 1
    seen_cursors: set[str] = set()
    mode: Optional[str] = None  # "cursor" | "next_url" | "page" once detected

    while True:
        payload = get_json(list_url, params=params)

        if debug and not _DEBUG_PRINTED.is_set():
            _DEBUG_PRINTED.set()
            tqdm.write("----- DEBUG: raw first list response -----")
            tqdm.write(json.dumps(payload, indent=2)[:4000])
            tqdm.write("------------------------------------------")

        items, next_url, meta = extract_list_and_next(payload)
        for item in items:
            if isinstance(item, dict):
                yield item

        if not items:
            break

        cursor = first_present(meta or {}, NEXT_CURSOR_KEYS) \
            or first_present(payload if isinstance(payload, dict) else {}, NEXT_CURSOR_KEYS)
        has_more = first_present(meta or {}, HAS_MORE_KEYS)
        if has_more is None and isinstance(payload, dict):
            has_more = first_present(payload, HAS_MORE_KEYS)

        # Explicit "no more pages" signal wins.
        if has_more is False and not next_url:
            break

        # 1) cursor-based (Otter's documented scheme)
        if cursor and str(cursor) not in seen_cursors:
            seen_cursors.add(str(cursor))
            params[CURSOR_PARAM] = cursor
            params.pop("page", None)
            params.pop("offset", None)
            mode = "cursor"
            continue

        # 2) next_url style
        if next_url:
            list_url = next_url if next_url.startswith("http") else base_url + next_url
            params = {}  # next_url carries its own query string
            mode = "next_url"
            continue

        # 3) page-number / offset fallback — only if we never locked onto another
        #    scheme. Continue while pages stay full or has_more is explicitly True.
        if mode in (None, "page"):
            page_size = params.get(PAGE_SIZE_PARAM, DEFAULT_PAGE_SIZE)
            if has_more is True or (page_size > 0 and len(items) >= page_size):
                mode = "page"
                page_num += 1
                params["page"] = page_num
                params["offset"] = (page_num - 1) * page_size
                continue

        break


# ----------------------------------------------------------------------------
# Per-conversation download
# ----------------------------------------------------------------------------

def fill(path_template: str, base_url: str, **kw) -> str:
    return base_url + path_template.format(**kw)


def find_existing(output_dir: Path, otter_id: str) -> Optional[Path]:
    matches = list(output_dir.glob(f"*/{otter_id}_*")) + \
        list(output_dir.glob(f"{otter_id}_*"))
    return matches[0] if matches else None


def fetch_full_conversation(conv: dict, base_url: str, debug: bool) -> dict:
    """Ensure we have text/summary/speakers, fetching detail/transcript if needed."""
    data = dict(conv)
    otter_id = field(conv, "id")

    if not field(data, "text") and not field(data, "utterances") and otter_id:
        try:
            detail = get_json(fill(ENDPOINTS["detail"], base_url, id=otter_id))
            if debug and not _DEBUG_PRINTED.is_set():
                _DEBUG_PRINTED.set()
                tqdm.write("----- DEBUG: raw first detail response -----")
                tqdm.write(json.dumps(detail, indent=2)[:4000])
                tqdm.write("--------------------------------------------")
            if isinstance(detail, dict):
                inner = detail
                for key in ("conversation", "speech", "data"):
                    if isinstance(detail.get(key), dict):
                        inner = detail[key]
                        break
                data = {**inner, **{k: v for k, v in data.items() if v not in (None, "")}}
        except requests.RequestException:
            pass

    # Last resort: dedicated transcript endpoint.
    if not field(data, "text") and not field(data, "utterances") and otter_id:
        try:
            tr = get_json(fill(ENDPOINTS["transcript"], base_url, id=otter_id))
            if isinstance(tr, dict):
                data.setdefault("transcript_text",
                                first_present(tr, FIELD_CANDIDATES["text"]))
                data.setdefault("utterances",
                                first_present(tr, FIELD_CANDIDATES["utterances"]))
            elif isinstance(tr, str):
                data["transcript_text"] = tr
        except requests.RequestException:
            pass

    return data


def resolve_transcript_text(data: dict) -> str:
    text = field(data, "text")
    if isinstance(text, list):
        text = utterances_to_text(text)
    if text:
        return str(text)
    return utterances_to_text(field(data, "utterances"))


def download_audio(data: dict, base_url: str, otter_id: str, dest: Path) -> bool:
    """Save audio.mp3. Endpoint may return binary or JSON with a signed URL."""
    audio_url = field(data, "audio_url")
    url = audio_url if (isinstance(audio_url, str) and audio_url.startswith("http")) \
        else fill(ENDPOINTS["audio"], base_url, id=otter_id)

    resp = request_with_retry("GET", url, stream=True)
    resp.raise_for_status()

    ctype = resp.headers.get("Content-Type", "")
    if "application/json" in ctype:  # indirection: body holds the real media URL
        signed = first_present(resp.json(), FIELD_CANDIDATES["audio_url"] + ["url"])
        if not signed:
            return False
        resp = request_with_retry("GET", signed, stream=True)
        resp.raise_for_status()

    with open(dest, "wb") as fh:
        for chunk in resp.iter_content(chunk_size=1 << 16):
            if chunk:
                fh.write(chunk)
    return dest.stat().st_size > 0


def process_conversation(conv: dict, args, base_url: str) -> dict:
    """Download one conversation. Returns a manifest row dict (never raises)."""
    otter_id = str(field(conv, "id") or "")
    title = str(field(conv, "title") or "Untitled")
    created = field(conv, "created")
    duration = field(conv, "duration")
    speakers = normalize_speakers(field(conv, "speakers"))

    row = {
        "otter_id": otter_id,
        "date": (parse_datetime(created).isoformat() if parse_datetime(created) else ""),
        "title": title,
        "duration": duration if duration is not None else "",
        "speakers": "; ".join(speakers),
        "local_path": "",
        "status": "failed",
    }

    if not otter_id:
        log.error("missing-id | could not extract an id from: %s",
                  json.dumps(conv)[:300])
        row["status"] = "failed"
        return row

    output_dir = Path(args.output)
    existing = find_existing(output_dir, otter_id)
    if existing and not args.force:
        row["local_path"] = str(existing)
        row["status"] = "skipped"
        return row

    try:
        data = fetch_full_conversation(conv, base_url, args.debug)

        # Refresh metadata that the detail call may have filled in.
        title = str(field(data, "title") or title)
        created = field(data, "created") or created
        duration = field(data, "duration") if field(data, "duration") is not None else duration
        speakers = normalize_speakers(field(data, "speakers")) or speakers

        folder = month_dir(created)
        conv_dir = output_dir / folder / f"{otter_id}_{slugify(title)}"
        if existing and args.force:
            conv_dir = existing
        conv_dir.mkdir(parents=True, exist_ok=True)

        transcript_text = resolve_transcript_text(data)
        if transcript_text:
            (conv_dir / "transcript.txt").write_text(transcript_text, encoding="utf-8")

        summary = field(data, "summary")
        if isinstance(summary, (dict, list)):
            summary = json.dumps(summary, indent=2)
        if summary:
            (conv_dir / "summary.txt").write_text(str(summary), encoding="utf-8")

        metadata = {
            "otter_id": otter_id,
            "title": title,
            "date": (parse_datetime(created).isoformat() if parse_datetime(created) else None),
            "duration": duration,
            "speakers": speakers,
            "folder": field(data, "folder"),
            "url": field(data, "url"),
        }
        (conv_dir / "metadata.json").write_text(
            json.dumps(metadata, indent=2, ensure_ascii=False), encoding="utf-8")

        if args.include_audio:
            try:
                download_audio(data, base_url, otter_id, conv_dir / "audio.mp3")
            except requests.RequestException as exc:
                log.error("audio | %s | %s", otter_id, exc)

        row.update({
            "date": metadata["date"] or "",
            "title": title,
            "duration": duration if duration is not None else "",
            "speakers": "; ".join(speakers),
            "local_path": str(conv_dir),
            "status": "downloaded",
        })
        return row

    except Exception as exc:  # never let one transcript crash the run
        log.error("download | %s | %s: %s", otter_id, type(exc).__name__, exc)
        row["status"] = "failed"
        return row


# ----------------------------------------------------------------------------
# Filters
# ----------------------------------------------------------------------------

def parse_cli_date(s: Optional[str]) -> Optional[date]:
    if not s:
        return None
    try:
        return datetime.strptime(s, "%Y-%m-%d").date()
    except ValueError:
        raise SystemExit(f"Invalid date '{s}'. Use YYYY-MM-DD.")


def build_list_params(args) -> dict:
    params: dict[str, Any] = {PAGE_SIZE_PARAM: args.page_size}

    def fmt_date(d: date) -> Any:
        if FILTER_DATE_FORMAT == "epoch":
            return int(datetime(d.year, d.month, d.day, tzinfo=timezone.utc).timestamp())
        return d.isoformat()

    if args.start_date:
        params[FILTER_PARAMS["start_date"]] = fmt_date(parse_cli_date(args.start_date))
    if args.end_date:
        params[FILTER_PARAMS["end_date"]] = fmt_date(parse_cli_date(args.end_date))
    if args.folder_id:
        params[FILTER_PARAMS["folder_id"]] = args.folder_id
    if args.group_id:
        params[FILTER_PARAMS["group_id"]] = args.group_id
    if args.speaker:
        params[FILTER_PARAMS["speaker"]] = args.speaker
    return params


def passes_client_filters(conv: dict, args) -> bool:
    """Belt-and-suspenders filtering in case the API ignores a query param."""
    start = parse_cli_date(args.start_date)
    end = parse_cli_date(args.end_date)
    if start or end:
        dt = parse_datetime(field(conv, "created"))
        if dt:
            d = dt.date()
            if start and d < start:
                return False
            if end and d > end:
                return False
    if args.speaker:
        names = [s.lower() for s in normalize_speakers(field(conv, "speakers"))]
        if names and args.speaker.lower() not in " ".join(names):
            return False
    return True


# ----------------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------------

def parse_args(argv: Optional[list[str]] = None) -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description="Bulk-download Otter.ai transcripts.",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter,
    )
    p.add_argument("--output", default="output", help="Root output directory")
    p.add_argument("--start-date", help="Only transcripts on/after this date (YYYY-MM-DD)")
    p.add_argument("--end-date", help="Only transcripts on/before this date (YYYY-MM-DD)")
    p.add_argument("--folder-id", help="Restrict to a folder id")
    p.add_argument("--group-id", help="Restrict to a group id")
    p.add_argument("--speaker", help="Restrict to transcripts featuring this speaker")
    p.add_argument("--include-audio", action="store_true",
                   help="Also download audio.mp3 (off by default)")
    p.add_argument("--force", action="store_true",
                   help="Re-download even if the transcript folder already exists")
    p.add_argument("--workers", type=int, default=5, help="Parallel download workers")
    p.add_argument("--page-size", type=int, default=DEFAULT_PAGE_SIZE,
                   help="Page size for the list endpoint")
    p.add_argument("--max", type=int, default=0,
                   help="Process at most N transcripts (0 = no limit; handy for a test run)")
    p.add_argument("--base-url", help="Override OTTER_BASE_URL")
    p.add_argument("--workspace-id", help="Override OTTER_WORKSPACE_ID")
    p.add_argument("--debug", action="store_true",
                   help="Print the raw first list/detail response, then continue")
    return p.parse_args(argv)


def configure_logging(output_dir: Path) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    handler = logging.FileHandler(output_dir / "errors.log", encoding="utf-8")
    handler.setFormatter(logging.Formatter("%(asctime)s | %(message)s"))
    log.setLevel(logging.ERROR)
    log.addHandler(handler)


def load_credentials() -> str:
    load_dotenv()
    token = (os.getenv("OTTER_API_KEY")
             or os.getenv("OTTER_ACCESS_TOKEN")
             or os.getenv("OTTER_BEARER_TOKEN"))
    if not token:
        sys.exit("ERROR: OTTER_API_KEY not found. Copy .env.example to .env and set it.")
    return token.strip()


def main(argv: Optional[list[str]] = None) -> int:
    args = parse_args(argv)
    output_dir = Path(args.output)
    configure_logging(output_dir)

    token = load_credentials()
    _AUTH_HEADERS.update({
        "Authorization": f"Bearer {token}",
        "Accept": "application/json",
    })

    base_url = (args.base_url or os.getenv("OTTER_BASE_URL") or DEFAULT_BASE_URL).rstrip("/")
    workspace_id = args.workspace_id or os.getenv("OTTER_WORKSPACE_ID")

    if workspace_id:
        list_url = fill(ENDPOINTS["list_workspace"], base_url, workspace_id=workspace_id)
    else:
        list_url = base_url + ENDPOINTS["list"]

    params = build_list_params(args)

    print(f"Listing transcripts from {list_url} ...")
    try:
        conversations = [
            c for c in iter_list_pages(base_url, list_url, params, debug=args.debug)
            if passes_client_filters(c, args)
        ]
    except requests.HTTPError as exc:
        print(f"\nERROR listing transcripts: {exc}", file=sys.stderr)
        print("Check OTTER_BASE_URL / the ENDPOINTS['list'] path in CONFIG, then retry "
              "with --debug.", file=sys.stderr)
        return 2

    if args.max and len(conversations) > args.max:
        conversations = conversations[:args.max]

    total = len(conversations)
    print(f"Found {total} transcript(s).")
    if total == 0:
        write_manifest(output_dir, [])
        return 0

    results: list[dict] = []
    counter = {"i": 0}
    counter_lock = threading.Lock()

    def run(conv: dict) -> dict:
        row = process_conversation(conv, args, base_url)
        with counter_lock:
            counter["i"] += 1
            i = counter["i"]
        tqdm.write(f"[{i}/{total}] {row['title']}  ->  {row['status']}")
        return row

    with ThreadPoolExecutor(max_workers=max(1, args.workers)) as pool:
        futures = [pool.submit(run, c) for c in conversations]
        for fut in tqdm(as_completed(futures), total=total, desc="Downloading", unit="tx"):
            results.append(fut.result())

    write_manifest(output_dir, results)

    downloaded = sum(1 for r in results if r["status"] == "downloaded")
    skipped = sum(1 for r in results if r["status"] == "skipped")
    failed = sum(1 for r in results if r["status"] == "failed")

    print("\n==================== SUMMARY ====================")
    print(f"  Total found : {total}")
    print(f"  Downloaded  : {downloaded}")
    print(f"  Skipped     : {skipped}")
    print(f"  Failed      : {failed}")
    print(f"  Manifest    : {output_dir / 'manifest.csv'}")
    if failed:
        print(f"  Errors log  : {output_dir / 'errors.log'}")
    print("=================================================")
    return 1 if failed and downloaded == 0 else 0


def write_manifest(output_dir: Path, rows: list[dict]) -> None:
    cols = ["otter_id", "date", "title", "duration", "speakers", "local_path", "status"]
    output_dir.mkdir(parents=True, exist_ok=True)
    with open(output_dir / "manifest.csv", "w", newline="", encoding="utf-8") as fh:
        writer = csv.DictWriter(fh, fieldnames=cols)
        writer.writeheader()
        for row in rows:
            writer.writerow({c: row.get(c, "") for c in cols})


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\nInterrupted.", file=sys.stderr)
        sys.exit(130)
