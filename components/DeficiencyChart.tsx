"use client";

import { motion } from "framer-motion";
import {
  NUTRIENT_LABELS,
  NUTRIENT_KEYS,
  getRiskLabel,
} from "@/lib/deficiency-engine";
import type { DeficiencyProfile, NutrientKey, RiskTier } from "@/types";

interface DeficiencyChartProps {
  profile: DeficiencyProfile;
  blurred?: boolean;
  className?: string;
  /** Optional per-nutrient daily target string (e.g. "400 mg/day"). */
  targets?: Partial<Record<NutrientKey, string>>;
}

const TIER_BAR: Record<RiskTier, string> = {
  high: "bg-gradient-to-r from-red to-red/60",
  moderate: "bg-gradient-to-r from-amber to-amber/60",
  low: "bg-gradient-to-r from-green to-green/60",
};

const TIER_TEXT: Record<RiskTier, string> = {
  high: "text-red",
  moderate: "text-amber",
  low: "text-green",
};

export default function DeficiencyChart({
  profile,
  blurred = false,
  className,
  targets,
}: DeficiencyChartProps) {
  const rows = NUTRIENT_KEYS.map((key) => ({
    key,
    score: profile[key],
    label: NUTRIENT_LABELS[key],
    risk: getRiskLabel(profile[key]),
    target: targets?.[key],
  })).sort((a, b) => b.score - a.score);

  return (
    <div
      className={[
        "card-base p-4 sm:p-6",
        blurred ? "select-none blur-[5px]" : "",
        className ?? "",
      ].join(" ")}
      aria-hidden={blurred}
    >
      <h3 className="text-base font-semibold text-text">Per-nutrient risk</h3>
      <p className="mt-1 text-xs text-sub">
        Sorted by risk. Higher bar = stronger signal to act. Targets shown
        when applicable.
      </p>

      <ul className="mt-5 flex flex-col gap-4">
        {rows.map((row, idx) => (
          <NutrientRow
            key={row.key}
            label={row.label}
            score={row.score}
            tier={row.risk.tier}
            riskLabel={row.risk.label}
            target={row.target}
            delay={idx * 0.05}
          />
        ))}
      </ul>
    </div>
  );
}

interface NutrientRowProps {
  label: string;
  score: number;
  tier: RiskTier;
  riskLabel: string;
  target?: string;
  delay: number;
}

function NutrientRow({
  label,
  score,
  tier,
  riskLabel,
  target,
  delay,
}: NutrientRowProps) {
  return (
    <li>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-text">{label}</span>
        <span className={`text-xs font-semibold ${TIER_TEXT[tier]}`}>
          {riskLabel} · {score}
        </span>
      </div>
      <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-card2">
        <motion.div
          className={`h-full rounded-full ${TIER_BAR[tier]}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.9, ease: "easeOut", delay }}
        />
      </div>
      {target ? (
        <p className="mt-1 text-[11px] text-muted">Target: {target}</p>
      ) : null}
    </li>
  );
}

export type { NutrientKey };
