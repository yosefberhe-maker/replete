"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  REDDIT_TEMPLATES,
  generateRedditPost,
  type RedditTemplateId,
} from "@/lib/reddit-templates";
import type { Drug, Duration } from "@/types";

interface RedditPostRecord {
  templateId: string;
  drug: string;
  duration: string;
  topic: string;
  includeReplete: boolean;
  body: string;
  timestamp: string;
}

interface RedditGeneratorProps {
  adminKey: string;
  history: RedditPostRecord[];
}

const DRUG_OPTIONS: { value: Drug; label: string }[] = [
  { value: "sema", label: "Semaglutide" },
  { value: "tirz", label: "Tirzepatide" },
  { value: "other", label: "Other / Not sure" },
];
const DURATION_OPTIONS: { value: Duration; label: string }[] = [
  { value: "0-3", label: "< 3 months" },
  { value: "3-6", label: "3–6 months" },
  { value: "6-12", label: "6–12 months" },
  { value: "12+", label: "12+ months" },
];

export default function RedditGenerator({
  adminKey,
  history,
}: RedditGeneratorProps) {
  const [templateId, setTemplateId] = useState<RedditTemplateId>(
    REDDIT_TEMPLATES[0].id,
  );
  const [drug, setDrug] = useState<Drug>("sema");
  const [duration, setDuration] = useState<Duration>("3-6");
  const [topic, setTopic] = useState("");
  const [includeReplete, setIncludeReplete] = useState(false);
  const [output, setOutput] = useState("");
  const [items, setItems] = useState(history);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function preview(): string {
    return generateRedditPost({
      templateId,
      drug,
      duration,
      topic,
      includeReplete,
    });
  }

  async function onGenerate() {
    const body = preview();
    setOutput(body);
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/reddit?key=${encodeURIComponent(adminKey)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId,
          drug,
          duration,
          topic,
          includeReplete,
        }),
      });
      const data = (await res.json()) as
        | { post: RedditPostRecord }
        | { error: string };
      if ("error" in data) {
        setError(data.error);
      } else {
        setItems([...items, data.post]);
      }
    } catch {
      setError("Network error — post not saved to history.");
    } finally {
      setSaving(false);
    }
  }

  function onCopy() {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    });
  }

  const selectedTemplate =
    REDDIT_TEMPLATES.find((t) => t.id === templateId) ?? REDDIT_TEMPLATES[0];

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <section className="card-base p-4 sm:p-5">
        <h2 className="text-base font-semibold text-text">Generator</h2>
        <p className="text-xs text-sub">{selectedTemplate.hint}</p>

        <div className="mt-4 flex flex-col gap-3">
          <Field label="Template">
            <select
              value={templateId}
              onChange={(e) =>
                setTemplateId(e.target.value as RedditTemplateId)
              }
              className="select-base"
            >
              {REDDIT_TEMPLATES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="User's drug">
            <select
              value={drug}
              onChange={(e) => setDrug(e.target.value as Drug)}
              className="select-base"
            >
              {DRUG_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Duration">
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value as Duration)}
              className="select-base"
            >
              {DURATION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Specific symptom or question they referenced">
            <textarea
              rows={3}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder='e.g. "shedding hair around month 4 and freaking out"'
              className="select-base resize-none"
            />
          </Field>

          <label className="flex items-center gap-3 text-sm text-text">
            <input
              type="checkbox"
              checked={includeReplete}
              onChange={(e) => setIncludeReplete(e.target.checked)}
              className="h-4 w-4 rounded border-border bg-bg text-green focus:ring-green"
            />
            <span>
              Include Replete mention{" "}
              <span className="text-muted">(use sparingly)</span>
            </span>
          </label>

          <button
            type="button"
            onClick={onGenerate}
            disabled={saving}
            className="btn-primary mt-2"
          >
            {saving ? "Generating…" : "Generate post"}
          </button>
          {error ? <p className="text-xs text-red">{error}</p> : null}
        </div>
      </section>

      <section className="card-base p-4 sm:p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-text">Generated output</h2>
          <button
            type="button"
            onClick={onCopy}
            disabled={!output}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border border-border bg-card2 px-3 py-1.5 text-xs font-medium transition-colors",
              output ? "text-text hover:text-green" : "text-muted",
            )}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-green" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" /> Copy
              </>
            )}
          </button>
        </div>
        <pre className="mt-3 max-h-[60vh] overflow-auto whitespace-pre-wrap break-words rounded-md border border-border bg-bg p-4 text-sm text-text">
          {output || preview()}
        </pre>
      </section>

      <section className="lg:col-span-2">
        <h2 className="text-base font-semibold text-text">History</h2>
        <p className="text-xs text-sub">
          Every generated post is saved to <code>data/reddit-posts.json</code>{" "}
          for review.
        </p>
        <ul className="mt-3 flex flex-col gap-2">
          {[...items].reverse().slice(0, 10).map((p, i) => (
            <li key={`${p.timestamp}-${i}`} className="card-base p-3">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                <span>
                  {REDDIT_TEMPLATES.find((t) => t.id === p.templateId)?.label ??
                    p.templateId}{" "}
                  · {p.drug} · {p.duration}
                </span>
                <span>{new Date(p.timestamp).toLocaleString()}</span>
              </div>
              <p className="mt-2 line-clamp-3 text-sm text-sub">{p.body}</p>
            </li>
          ))}
          {items.length === 0 ? (
            <li className="text-sm text-muted">No history yet.</li>
          ) : null}
        </ul>
      </section>

      <style jsx global>{`
        .select-base {
          background: var(--bg);
          color: var(--text);
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 10px 12px;
          font-size: 14px;
          width: 100%;
        }
        .select-base:focus {
          outline: none;
          border-color: var(--green);
        }
      `}</style>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-xs font-semibold uppercase tracking-widest text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}
