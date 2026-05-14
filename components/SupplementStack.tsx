"use client";

import { motion } from "framer-motion";
import { AlertTriangle, ArrowUp, Check, Leaf } from "lucide-react";
import type { SupplementPriority, SupplementRecommendation } from "@/types";

interface SupplementStackProps {
  supplements: SupplementRecommendation[];
}

const PRIORITY_META: Record<
  SupplementPriority,
  {
    label: string;
    Icon: typeof AlertTriangle;
    border: string;
    badgeBg: string;
    badgeText: string;
  }
> = {
  critical: {
    label: "Critical",
    Icon: AlertTriangle,
    border: "border-l-red",
    badgeBg: "bg-red/15",
    badgeText: "text-red",
  },
  high: {
    label: "High priority",
    Icon: ArrowUp,
    border: "border-l-amber",
    badgeBg: "bg-amber/15",
    badgeText: "text-amber",
  },
  support: {
    label: "Support",
    Icon: Check,
    border: "border-l-green",
    badgeBg: "bg-green/15",
    badgeText: "text-green",
  },
};

export default function SupplementStack({ supplements }: SupplementStackProps) {
  return (
    <div className="flex flex-col gap-3">
      {supplements.map((s, idx) => (
        <motion.div
          key={s.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.04 * idx }}
        >
          <SupplementCard supplement={s} />
        </motion.div>
      ))}
    </div>
  );
}

function SupplementCard({
  supplement,
}: {
  supplement: SupplementRecommendation;
}) {
  const meta = PRIORITY_META[supplement.priority];
  const Icon = meta.Icon;
  return (
    <article
      className={`card-base border-l-4 ${meta.border} p-4 sm:p-5`}
      aria-label={supplement.name}
    >
      <header className="flex items-start gap-3">
        <span className="text-2xl" aria-hidden>
          {supplement.foodOnly ? "🥑" : supplement.icon}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-text">
              {supplement.name}
            </h3>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${meta.badgeBg} ${meta.badgeText}`}
            >
              <Icon className="h-3 w-3" />
              {meta.label}
            </span>
            {supplement.foodOnly ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-blue/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-blue">
                <Leaf className="h-3 w-3" />
                Food only
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm font-medium text-text/90">
            {supplement.dose}
            <span className="text-sub"> · {supplement.timing}</span>
          </p>
        </div>
      </header>

      <p className="mt-3 text-sm text-sub">
        <span className="font-semibold text-text">Form: </span>
        {supplement.form}
      </p>
      <p className="mt-2 text-sm text-sub">{supplement.why}</p>

      {supplement.caution ? (
        <p className="mt-3 rounded-md border border-amber/40 bg-amber/10 p-3 text-xs text-amber">
          <span className="font-semibold">Caution: </span>
          {supplement.caution}
        </p>
      ) : null}
    </article>
  );
}
