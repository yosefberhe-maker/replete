"use client";

import DeficiencyChart from "@/components/DeficiencyChart";
import type { DeficiencyProfile } from "@/types";

const SAMPLE_PROFILE: DeficiencyProfile = {
  protein: 78,
  b12: 68,
  iron: 72,
  magnesium: 65,
  zinc: 58,
  vitaminD: 52,
  choline: 48,
  potassium: 43,
  overallScore: 61,
  riskTier: "moderate",
};

export default function SamplePreview() {
  return (
    <div className="relative">
      <DeficiencyChart profile={SAMPLE_PROFILE} blurred />
      <div className="pointer-events-none absolute inset-0 flex items-end justify-center bg-gradient-to-t from-bg via-bg/40 to-transparent p-6">
        <p className="text-center text-xs text-sub">
          Sample preview · your actual results will show your specific risk profile
        </p>
      </div>
    </div>
  );
}
