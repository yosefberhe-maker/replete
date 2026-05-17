"use client";

import { motion } from "framer-motion";
import { Activity, AlertTriangle, Droplet } from "lucide-react";
import type { CycleAdvice } from "@/types";

const PHASE_META: Record<
  CycleAdvice["phase"],
  { label: string; tint: string; ring: string; chipBg: string; chipText: string }
> = {
  peak: {
    label: "Peak suppression",
    tint: "from-red/15 via-red/5 to-transparent",
    ring: "ring-red/40",
    chipBg: "bg-red/15",
    chipText: "text-red",
  },
  plateau: {
    label: "Plateau",
    tint: "from-amber/15 via-amber/5 to-transparent",
    ring: "ring-amber/40",
    chipBg: "bg-amber/15",
    chipText: "text-amber",
  },
  trough: {
    label: "Trough · pre-injection",
    tint: "from-green/15 via-green/5 to-transparent",
    ring: "ring-green/40",
    chipBg: "bg-green/15",
    chipText: "text-green",
  },
};

interface Props {
  cycle: CycleAdvice;
}

export default function CyclePhaseCard({ cycle }: Props) {
  const meta = PHASE_META[cycle.phase];
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`card-base relative overflow-hidden p-5 sm:p-6 ring-1 ${meta.ring}`}
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${meta.tint}`}
        aria-hidden
      />
      <div className="relative">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-muted">
            Today · day {cycle.dayOfCycle} of cycle
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${meta.chipBg} ${meta.chipText}`}
          >
            <Activity className="h-3 w-3" />
            {meta.label}
          </span>
        </div>
        <h2 className="mt-2 text-xl font-extrabold tracking-tight text-text sm:text-2xl">
          {cycle.headline}
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-green">
              <Droplet className="h-3.5 w-3.5" />
              Today's focus
            </p>
            <ul className="mt-2 flex flex-col gap-2 text-sm text-text">
              {cycle.actions.map((a) => (
                <li key={a} className="flex gap-2">
                  <span className="mt-1.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-green" />
                  <span>{a}</span>
                </li>
              ))}
            </ul>
          </div>
          {cycle.avoid.length > 0 ? (
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-amber">
                <AlertTriangle className="h-3.5 w-3.5" />
                Avoid
              </p>
              <ul className="mt-2 flex flex-col gap-2 text-sm text-sub">
                {cycle.avoid.map((a) => (
                  <li key={a} className="flex gap-2">
                    <span className="mt-1.5 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-amber" />
                    <span>{a}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </div>
    </motion.section>
  );
}
