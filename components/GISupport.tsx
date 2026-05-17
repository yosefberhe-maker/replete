"use client";

import { Droplets, ShieldAlert } from "lucide-react";
import type { GIProtocol } from "@/types";

const TRIGGER_LABEL: Record<"nausea" | "constipation", string> = {
  nausea: "Nausea",
  constipation: "Constipation",
};

const PROTEIN_FORM_LABEL: Record<GIProtocol["proteinForm"], string> = {
  "liquid-only": "Liquid protein only (whey shakes, bone broth + isolate)",
  "preferred-liquid": "Lean toward liquid protein where possible",
  any: "Any form is fine",
};

interface Props {
  gi: GIProtocol;
}

export default function GISupport({ gi }: Props) {
  if (!gi.active) return null;
  return (
    <section className="card-base border-l-4 border-l-blue p-5 sm:p-6">
      <div className="flex flex-wrap items-center gap-2">
        <ShieldAlert className="h-4 w-4 text-blue" aria-hidden />
        <span className="text-xs font-semibold uppercase tracking-widest text-blue">
          GI countermeasure protocol
        </span>
        {gi.triggers.map((t) => (
          <span
            key={t}
            className="rounded-full bg-blue/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue"
          >
            {TRIGGER_LABEL[t]}
          </span>
        ))}
      </div>

      <h2 className="mt-3 text-lg font-bold text-text sm:text-xl">
        Adjustments while you're symptomatic
      </h2>
      <p className="mt-1 text-sm text-sub">
        These override your standard stack until the symptom resolves.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            Do
          </p>
          <ul className="mt-2 flex flex-col gap-2 text-sm text-text">
            {gi.priorityRecommendations.map((r) => (
              <li key={r} className="flex gap-2">
                <span className="mt-1.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-blue" />
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">
            Pause / adjust
          </p>
          <ul className="mt-2 flex flex-col gap-2 text-sm text-sub">
            {gi.pauseSupplements.length > 0 ? (
              <li className="flex gap-2">
                <span className="mt-1.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber" />
                <span>
                  Pause:{" "}
                  <span className="text-text">
                    {gi.pauseSupplements.join(", ")}
                  </span>
                </span>
              </li>
            ) : null}
            <li className="flex gap-2">
              <span className="mt-1.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber" />
              <span>
                Protein form:{" "}
                <span className="text-text">
                  {PROTEIN_FORM_LABEL[gi.proteinForm]}
                </span>
              </span>
            </li>
            <li className="flex items-center gap-2">
              <Droplets className="h-3.5 w-3.5 text-blue" aria-hidden />
              <span>
                Fluid target: {gi.fluidTargetLitres} L/day minimum
              </span>
            </li>
          </ul>
        </div>
      </div>

      {gi.notes.length > 0 ? (
        <div className="mt-4 rounded-lg border border-border bg-bg/60 p-3 text-xs text-sub">
          <ul className="flex flex-col gap-1">
            {gi.notes.map((n) => (
              <li key={n}>· {n}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
