"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CompleteProfile } from "@/types";

interface WaitlistFormProps {
  profile?: CompleteProfile | null;
  variant?: "card" | "inline";
  ctaLabel?: string;
}

type Status = "idle" | "submitting" | "ok" | "error";

export default function WaitlistForm({
  profile,
  variant = "card",
  ctaLabel = "Join waitlist",
}: WaitlistFormProps) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!email || status === "submitting") return;
    setStatus("submitting");
    setMessage(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          profile: profile?.profile,
          intakeData: profile?.intake,
        }),
      });
      const data = (await res.json()) as { success?: boolean; error?: string };
      if (!res.ok || !data.success) {
        setStatus("error");
        setMessage(data.error ?? "Something went wrong. Try again?");
        return;
      }
      setStatus("ok");
      setMessage("You're on the list. Check your inbox for your welcome plan.");
      setEmail("");
    } catch {
      setStatus("error");
      setMessage("Network hiccup. Try again?");
    }
  }

  if (status === "ok") {
    return (
      <div
        className={cn(
          "flex items-start gap-3 rounded-xl border border-green/40 bg-green/10 p-4 text-sm text-text",
          variant === "card" ? "" : "",
        )}
      >
        <Check className="mt-0.5 h-5 w-5 flex-shrink-0 text-green" />
        <p>{message}</p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        "flex w-full flex-col gap-2 sm:flex-row",
        variant === "card" ? "card-base p-3" : "",
      )}
    >
      <label className="sr-only" htmlFor="waitlist-email">
        Email address
      </label>
      <input
        id="waitlist-email"
        type="email"
        required
        autoComplete="email"
        inputMode="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="min-w-0 flex-1 rounded-lg border border-border bg-bg px-4 py-3 text-sm text-text placeholder:text-muted focus:border-green focus:outline-none"
      />
      <button
        type="submit"
        disabled={status === "submitting"}
        className="btn-primary"
      >
        {status === "submitting" ? "Joining…" : ctaLabel}
      </button>
      {status === "error" && message ? (
        <p
          role="status"
          className="basis-full text-xs text-red sm:text-right"
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
