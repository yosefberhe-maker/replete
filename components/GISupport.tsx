"use client";

import { AlertTriangle, Droplets, ShieldAlert } from "lucide-react";
import type { GIProtocol } from "@/types";

const TRIGGER_LABEL: Record<"nausea" | "vomiting" | "constipation", string> = {
  nausea: "Nausea",
  vomiting: "Vomiting",
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
  const accent = gi.thiamineUrgent ? "red" : "blue";
  return (
    <section
      className={`card-base border-l-4 p-5 sm:p-6 ${
        gi.thiamineUrgent ? "border-l-red" : "border-l-blue"
      }`}
    >
      {gi.thiamineUrgent ? (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-red/40 bg-red/5 p-3">
          <AlertTriangle
            className="mt-0.5 h-5 w-5 flex-shrink-0 text-red"
            aria-hidden
          />
          <div className="min-w-0 text-sm">
            <p className="font-semibold text-text">
              Persistent vomiting — talk to your prescriber today
            </p>
            <p className="mt-1 text-sub">
              Prolonged vomiting on a GLP-1 elevates the risk of Wernicke&apos;s
              encephalopathy (rare but serious). Thiamine (B1) is in your
              recommended stack below. Symptoms that warrant urgent care:
              confusion, vision changes, balance problems, or inability to
              keep fluids down for 24+ hr.
            </p>
          </div>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <ShieldAlert
          className={`h-4 w-4 ${accent === "red" ? "text-red" : "text-blue"}`}
          aria-hidden
        />
        <span
          className={`text-xs font-semibold uppercase tracking-widest ${
            accent === "red" ? "text-red" : "text-blue"
          }`}
        >
          GI countermeasure protocol
        </span>
        {gi.triggers.map((t) => (
          <span
            key={t}
            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
              t === "vomiting"
                ? "bg-red/15 text-red"
                : "bg-blue/15 text-blue"
            }`}
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
