"use client";

import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download } from "lucide-react";
import { RepleteWordmark } from "@/components/RepleteWordmark";
import { NUTRIENT_KEYS, NUTRIENT_LABELS } from "@/lib/deficiency-engine";
import { DRUG_LABEL, DURATION_LABEL } from "@/lib/copy";
import type { WaitlistEntry } from "@/lib/storage";
import type { DeficiencyProfile, NutrientKey, RiskTier } from "@/types";

interface AdminDashboardProps {
  entries: WaitlistEntry[];
}

const TIER_COLOR: Record<RiskTier, string> = {
  high: "#EF4444",
  moderate: "#F59E0B",
  low: "#10B981",
};

export default function AdminDashboard({ entries }: AdminDashboardProps) {
  const stats = useMemo(() => computeStats(entries), [entries]);

  return (
    <main className="container-page py-8">
      <header className="flex items-center justify-between">
        <RepleteWordmark />
        <span className="text-xs text-muted">Admin · internal only</span>
      </header>

      <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-text">
        Replete admin dashboard
      </h1>
      <p className="text-sub">Operational snapshot of the waitlist.</p>

      <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard label="Total signups" value={stats.total.toLocaleString()} />
        <SummaryCard label="This week" value={stats.weeklyCount.toLocaleString()} />
        <SummaryCard label="Today" value={stats.todayCount.toLocaleString()} />
        <SummaryCard
          label="Avg overall risk"
          value={stats.avgScore.toFixed(1)}
          accent={
            stats.avgScore >= 65
              ? "text-red"
              : stats.avgScore >= 40
              ? "text-amber"
              : "text-green"
          }
        />
      </section>

      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="High-risk frequency by nutrient"
          subtitle="% of profiles scoring ≥ 65 on each nutrient"
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={stats.highRiskFrequency}
              layout="vertical"
              margin={{ left: 20, right: 16, top: 4, bottom: 4 }}
            >
              <XAxis
                type="number"
                tick={{ fill: "#94A3B8", fontSize: 11 }}
                domain={[0, 100]}
                unit="%"
                axisLine={{ stroke: "#1E293B" }}
                tickLine={{ stroke: "#1E293B" }}
              />
              <YAxis
                type="category"
                dataKey="label"
                tick={{ fill: "#F1F5F9", fontSize: 12 }}
                axisLine={{ stroke: "#1E293B" }}
                tickLine={{ stroke: "#1E293B" }}
                width={92}
              />
              <Tooltip
                cursor={{ fill: "rgba(15,22,35,0.6)" }}
                contentStyle={{
                  background: "#0F1623",
                  border: "1px solid #1E293B",
                  borderRadius: 8,
                  color: "#F1F5F9",
                }}
                formatter={(v: number) => [`${v.toFixed(0)}%`, "High risk"]}
              />
              <Bar dataKey="pct" fill="#10B981" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Drug distribution"
          subtitle="Share of signups by GLP-1"
        >
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie
                data={stats.drugDistribution}
                dataKey="value"
                nameKey="label"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
              >
                {stats.drugDistribution.map((d, i) => (
                  <Cell
                    key={d.label}
                    fill={["#10B981", "#3B82F6", "#F59E0B"][i % 3]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#0F1623",
                  border: "1px solid #1E293B",
                  borderRadius: 8,
                  color: "#F1F5F9",
                }}
                formatter={(v: number) => [`${v}`, "Signups"]}
              />
            </PieChart>
          </ResponsiveContainer>
          <ul className="mt-3 grid grid-cols-3 gap-2 text-xs text-sub">
            {stats.drugDistribution.map((d, i) => (
              <li key={d.label} className="flex items-center gap-1.5">
                <span
                  className="inline-block h-2 w-2 rounded-full"
                  style={{
                    background: ["#10B981", "#3B82F6", "#F59E0B"][i % 3],
                  }}
                />
                <span>
                  {d.label}: {d.value}
                </span>
              </li>
            ))}
          </ul>
        </ChartCard>

        <ChartCard
          title="Duration distribution"
          subtitle="Where users are in their GLP-1 journey"
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={stats.durationDistribution}
              margin={{ left: 4, right: 16, top: 4, bottom: 4 }}
            >
              <XAxis
                dataKey="label"
                tick={{ fill: "#94A3B8", fontSize: 11 }}
                axisLine={{ stroke: "#1E293B" }}
                tickLine={{ stroke: "#1E293B" }}
              />
              <YAxis
                tick={{ fill: "#94A3B8", fontSize: 11 }}
                axisLine={{ stroke: "#1E293B" }}
                tickLine={{ stroke: "#1E293B" }}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(15,22,35,0.6)" }}
                contentStyle={{
                  background: "#0F1623",
                  border: "1px solid #1E293B",
                  borderRadius: 8,
                  color: "#F1F5F9",
                }}
              />
              <Bar dataKey="value" fill="#3B82F6" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Risk tier mix"
          subtitle="High / moderate / low across all signups"
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={stats.tierMix}
              margin={{ left: 4, right: 16, top: 4, bottom: 4 }}
            >
              <XAxis
                dataKey="label"
                tick={{ fill: "#94A3B8", fontSize: 11 }}
                axisLine={{ stroke: "#1E293B" }}
                tickLine={{ stroke: "#1E293B" }}
              />
              <YAxis
                tick={{ fill: "#94A3B8", fontSize: 11 }}
                axisLine={{ stroke: "#1E293B" }}
                tickLine={{ stroke: "#1E293B" }}
                allowDecimals={false}
              />
              <Tooltip
                cursor={{ fill: "rgba(15,22,35,0.6)" }}
                contentStyle={{
                  background: "#0F1623",
                  border: "1px solid #1E293B",
                  borderRadius: 8,
                  color: "#F1F5F9",
                }}
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {stats.tierMix.map((t) => (
                  <Cell key={t.tier} fill={TIER_COLOR[t.tier]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </section>

      <RecentSignups entries={entries} />

      <section className="mt-8">
        <ExportButton entries={entries} />
      </section>
    </main>
  );
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <div className="card-base p-4">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted">
        {label}
      </p>
      <p className={`mt-1 text-3xl font-extrabold ${accent ?? "text-text"}`}>
        {value}
      </p>
    </div>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card-base p-4 sm:p-5">
      <p className="text-base font-semibold text-text">{title}</p>
      <p className="text-xs text-sub">{subtitle}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function RecentSignups({ entries }: { entries: WaitlistEntry[] }) {
  const [order, setOrder] = useState<"desc" | "asc">("desc");
  const rows = useMemo(() => {
    const sorted = [...entries].sort((a, b) => {
      const aT = new Date(a.timestamp).getTime();
      const bT = new Date(b.timestamp).getTime();
      return order === "desc" ? bT - aT : aT - bT;
    });
    return sorted.slice(0, 20);
  }, [entries, order]);

  return (
    <section className="mt-8 card-base overflow-hidden">
      <div className="flex items-center justify-between p-4 sm:p-5">
        <div>
          <p className="text-base font-semibold text-text">
            Recent signups
          </p>
          <p className="text-xs text-sub">Most recent 20 entries.</p>
        </div>
        <button
          type="button"
          onClick={() => setOrder(order === "desc" ? "asc" : "desc")}
          className="rounded-md border border-border bg-card2 px-3 py-1.5 text-xs font-medium text-sub hover:text-text"
        >
          Sort: {order === "desc" ? "Newest first" : "Oldest first"}
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-y border-border text-xs uppercase tracking-widest text-muted">
            <tr>
              <th className="px-4 py-2 sm:px-5">Timestamp</th>
              <th className="px-4 py-2 sm:px-5">Email</th>
              <th className="px-4 py-2 sm:px-5">Risk tier</th>
              <th className="px-4 py-2 sm:px-5">Drug</th>
              <th className="px-4 py-2 sm:px-5">Duration</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-6 text-sub">
                  No signups yet. Send /intake to a friend or post to Reddit.
                </td>
              </tr>
            ) : (
              rows.map((e, i) => (
                <tr
                  key={`${e.timestamp}-${i}`}
                  className="border-b border-border/60"
                >
                  <td className="px-4 py-3 text-sub sm:px-5">
                    {new Date(e.timestamp).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-text sm:px-5">
                    {maskEmail(e.email)}
                  </td>
                  <td className="px-4 py-3 sm:px-5">
                    {e.profile ? (
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${tierBadge(
                          e.profile.riskTier,
                        )}`}
                      >
                        {e.profile.riskTier}
                      </span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sub sm:px-5">
                    {e.intake ? DRUG_LABEL[e.intake.drug] : "—"}
                  </td>
                  <td className="px-4 py-3 text-sub sm:px-5">
                    {e.intake ? DURATION_LABEL[e.intake.duration] : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ExportButton({ entries }: { entries: WaitlistEntry[] }) {
  function exportCsv() {
    const headers = [
      "timestamp",
      "email",
      "drug",
      "duration",
      "dose",
      "diet",
      "symptoms",
      "overallScore",
      "riskTier",
    ];
    const rows = entries.map((e) => [
      e.timestamp,
      e.email,
      e.intake?.drug ?? "",
      e.intake?.duration ?? "",
      e.intake?.dose ?? "",
      e.intake?.diet ?? "",
      (e.intake?.symptoms ?? []).join(";"),
      e.profile?.overallScore ?? "",
      e.profile?.riskTier ?? "",
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `replete-waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
  return (
    <button type="button" onClick={exportCsv} className="btn-ghost inline-flex">
      <Download className="mr-2 h-4 w-4" />
      Export waitlist as CSV
    </button>
  );
}

function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!user || !domain) return email;
  const visible = user.slice(0, 2);
  const hidden = "*".repeat(Math.max(1, user.length - 2));
  return `${visible}${hidden}@${domain}`;
}

function tierBadge(tier: RiskTier): string {
  if (tier === "high") return "bg-red/15 text-red";
  if (tier === "moderate") return "bg-amber/15 text-amber";
  return "bg-green/15 text-green";
}

interface ComputedStats {
  total: number;
  weeklyCount: number;
  todayCount: number;
  avgScore: number;
  highRiskFrequency: { key: NutrientKey; label: string; pct: number }[];
  drugDistribution: { label: string; value: number }[];
  durationDistribution: { label: string; value: number }[];
  tierMix: { tier: RiskTier; label: string; value: number }[];
}

function computeStats(entries: WaitlistEntry[]): ComputedStats {
  const total = entries.length;
  const now = Date.now();
  const weekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const dayAgo = now - 24 * 60 * 60 * 1000;

  let weeklyCount = 0;
  let todayCount = 0;
  let scoreSum = 0;
  let scoreCount = 0;

  for (const e of entries) {
    const t = new Date(e.timestamp).getTime();
    if (t >= weekAgo) weeklyCount += 1;
    if (t >= dayAgo) todayCount += 1;
    if (e.profile) {
      scoreSum += e.profile.overallScore;
      scoreCount += 1;
    }
  }

  const avgScore = scoreCount > 0 ? scoreSum / scoreCount : 0;

  const highRiskFrequency = NUTRIENT_KEYS.map((key) => {
    const withProfile = entries.filter(
      (e): e is WaitlistEntry & { profile: DeficiencyProfile } => !!e.profile,
    );
    const matches = withProfile.filter((e) => e.profile[key] >= 65).length;
    const pct = withProfile.length === 0 ? 0 : (matches / withProfile.length) * 100;
    return { key, label: NUTRIENT_LABELS[key], pct };
  }).sort((a, b) => b.pct - a.pct);

  const drugCounts: Record<string, number> = { sema: 0, tirz: 0, other: 0 };
  const durationCounts: Record<string, number> = {
    "0-3": 0,
    "3-6": 0,
    "6-12": 0,
    "12+": 0,
  };
  const tierCounts: Record<RiskTier, number> = { high: 0, moderate: 0, low: 0 };

  for (const e of entries) {
    if (e.intake) {
      drugCounts[e.intake.drug] = (drugCounts[e.intake.drug] ?? 0) + 1;
      durationCounts[e.intake.duration] =
        (durationCounts[e.intake.duration] ?? 0) + 1;
    }
    if (e.profile) {
      tierCounts[e.profile.riskTier] += 1;
    }
  }

  const drugDistribution = [
    { label: "Semaglutide", value: drugCounts.sema ?? 0 },
    { label: "Tirzepatide", value: drugCounts.tirz ?? 0 },
    { label: "Other", value: drugCounts.other ?? 0 },
  ];

  const durationDistribution = [
    { label: "<3mo", value: durationCounts["0-3"] ?? 0 },
    { label: "3–6mo", value: durationCounts["3-6"] ?? 0 },
    { label: "6–12mo", value: durationCounts["6-12"] ?? 0 },
    { label: "12mo+", value: durationCounts["12+"] ?? 0 },
  ];

  const tierMix: { tier: RiskTier; label: string; value: number }[] = [
    { tier: "high", label: "High", value: tierCounts.high },
    { tier: "moderate", label: "Moderate", value: tierCounts.moderate },
    { tier: "low", label: "Low", value: tierCounts.low },
  ];

  return {
    total,
    weeklyCount,
    todayCount,
    avgScore,
    highRiskFrequency,
    drugDistribution,
    durationDistribution,
    tierMix,
  };
}
