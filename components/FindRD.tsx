"use client";

import { useEffect, useState } from "react";
import { ArrowRight, MapPin } from "lucide-react";
import { TIMEZONE_TO_STATE, US_STATES } from "@/lib/us-states";

/**
 * Future-state RD marketplace stub. Today: state dropdown + mailto link
 * to waitlist@replete.app with a "RD Referral - [State]" subject so we can
 * see demand by state. NOT a compliance gate — every state works.
 */

const RD_INBOX = "waitlist@replete.app";

export default function FindRD() {
  const [state, setState] = useState<string>("");

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const guess = TIMEZONE_TO_STATE[tz];
      if (guess) setState(guess);
    } catch {
      // ignored — locale detection is a nice-to-have
    }
  }, []);

  const selected = US_STATES.find((s) => s.value === state);
  const stateLabel = selected?.label ?? "your state";
  const subject = selected
    ? `RD Referral - ${selected.label}`
    : "RD Referral";
  const mailto = `mailto:${RD_INBOX}?subject=${encodeURIComponent(subject)}`;

  return (
    <section className="card-base p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-green/10 text-green"
          aria-hidden
        >
          <MapPin className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold text-text">
            Want personalized guidance?
          </h3>
          <p className="mt-1 text-sm text-sub">
            Connect with a Registered Dietitian licensed in{" "}
            <span className="font-semibold text-text">{stateLabel}</span> who
            specializes in GLP-1 nutrition.
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex-1">
              <span className="sr-only">Select your state</span>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full rounded-lg border border-border bg-bg px-3 py-3 text-sm text-text focus:border-green focus:outline-none"
              >
                <option value="">Select your state…</option>
                {US_STATES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
            <a
              href={mailto}
              className="btn-primary inline-flex w-full justify-center sm:w-auto"
            >
              Find an RD near me
              <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </div>
          <p className="mt-3 text-xs text-muted">
            We&apos;ll route your request to a vetted dietitian in your state.
            Currently a manual referral — automated marketplace coming soon.
          </p>
        </div>
      </div>
    </section>
  );
}
