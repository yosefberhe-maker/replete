"use client";

import { AlertTriangle, Info } from "lucide-react";
import type { SafetyAlert } from "@/types";

const META: Record<
  SafetyAlert["severity"],
  { Icon: typeof AlertTriangle; ring: string; chip: string; tint: string }
> = {
  warning: {
    Icon: AlertTriangle,
    ring: "border-amber/40",
    chip: "bg-amber/15 text-amber",
    tint: "bg-amber/5",
  },
  info: {
    Icon: Info,
    ring: "border-blue/40",
    chip: "bg-blue/15 text-blue",
    tint: "bg-blue/5",
  },
};

interface Props {
  alerts: SafetyAlert[];
}

export default function SafetyAlerts({ alerts }: Props) {
  if (alerts.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      {alerts.map((a) => {
        const meta = META[a.severity];
        const Icon = meta.Icon;
        return (
          <div
            key={a.id}
            className={`rounded-xl border ${meta.ring} ${meta.tint} p-4`}
          >
            <div className="flex items-start gap-3">
              <span
                className={`mt-0.5 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${meta.chip}`}
                aria-hidden
              >
                <Icon className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text">{a.title}</p>
                <p className="mt-1 text-sm text-sub">{a.body}</p>
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}
