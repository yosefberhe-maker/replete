/**
 * POST /api/share
 *
 * Receives a CompleteProfile, computes an anonymized view, persists it under
 * a short 6-char alphanumeric code, and returns the code so the client can
 * link to /r/[code]. No PII (weight, exact age) is stored.
 */

import { NextResponse } from "next/server";
import { appendSharedProfile, findSharedProfile } from "@/lib/storage";
import { NUTRIENT_LABELS } from "@/lib/deficiency-engine";
import type { CompleteProfile, NutrientKey } from "@/types";

interface SharedProfileTopDeficiency {
  key: string;
  label: string;
  score: number;
}

export const runtime = "nodejs";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I confusion
const CODE_LEN = 6;
const MAX_ATTEMPTS = 8;

function randomCode(): string {
  let out = "";
  for (let i = 0; i < CODE_LEN; i++) {
    out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  }
  return out;
}

async function uniqueCode(): Promise<string> {
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const code = randomCode();
    const existing = await findSharedProfile(code);
    if (!existing) return code;
  }
  throw new Error("Could not allocate a unique share code");
}

export async function POST(req: Request): Promise<Response> {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const data = body as Partial<CompleteProfile> | null;
  if (!data?.intake || !data.profile || !data.supplements) {
    return NextResponse.json(
      { error: "Missing intake, profile, or supplements" },
      { status: 400 },
    );
  }

  const { intake, profile, supplements } = data;

  const topDeficiencies: SharedProfileTopDeficiency[] = (
    Object.entries(profile) as [string, number | string][]
  )
    .filter(
      ([k]) =>
        !["overallScore", "riskTier", "dailyProteinTargetG"].includes(k),
    )
    .map(([k, v]) => ({
      key: k,
      score: Number(v),
      label:
        NUTRIENT_LABELS[k as NutrientKey] ??
        k.replace(/^./, (c) => c.toUpperCase()),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 3);

  const code = await uniqueCode();

  await appendSharedProfile({
    code,
    createdAt: new Date().toISOString(),
    drug: intake.drug,
    duration: intake.duration,
    diet: intake.diet,
    dose: intake.dose,
    overallScore: profile.overallScore,
    riskTier: profile.riskTier,
    topDeficiencies,
    supplements: supplements
      .filter((s) => !s.foodOnly)
      .slice(0, 6)
      .map((s) => ({
        id: s.id,
        name: s.name,
        dose: s.dose,
        priority: s.priority,
        icon: s.icon,
        deficiencyKey: s.deficiencyKey,
      })),
  });

  return NextResponse.json({ code });
}
