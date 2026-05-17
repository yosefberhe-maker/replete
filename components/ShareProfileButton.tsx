"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CompleteProfile } from "@/types";

interface Props {
  data: CompleteProfile;
}

export default function ShareProfileButton({ data }: Props) {
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onShare() {
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const payload = (await res.json()) as { code?: string; error?: string };
      if (!res.ok || !payload.code) {
        setStatus("error");
        setError(payload.error ?? "Could not create share link.");
        return;
      }
      setCode(payload.code);
      setStatus("ready");
    } catch {
      setStatus("error");
      setError("Network hiccup. Try again?");
    }
  }

  const shareUrl =
    typeof window !== "undefined" && code
      ? `${window.location.origin}/r/${code}`
      : null;

  function copy() {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    });
  }

  if (status === "ready" && shareUrl) {
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-green/40 bg-green/5 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-text">
          <Check className="h-4 w-4 text-green" /> Share link ready
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <code className="flex-1 min-w-0 truncate rounded-md border border-border bg-bg px-3 py-2 text-xs text-text">
            {shareUrl}
          </code>
          <button
            type="button"
            onClick={copy}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md border border-border bg-card2 px-3 py-2 text-xs font-medium transition-colors",
              copied ? "text-green" : "text-text hover:text-green",
            )}
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5" /> Copied
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" /> Copy link
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-muted">
          The public page shows your drug, duration, diet, and top 3
          deficiencies. Weight, age, sex, and symptoms are excluded.
        </p>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={onShare}
        disabled={status === "loading"}
        className="btn-ghost inline-flex"
      >
        <Share2 className="mr-2 h-4 w-4" />
        {status === "loading" ? "Creating link…" : "Share my profile"}
      </button>
      {error ? <p className="mt-2 text-xs text-red">{error}</p> : null}
    </div>
  );
}
