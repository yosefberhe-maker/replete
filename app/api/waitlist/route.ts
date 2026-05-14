/**
 * Waitlist signup endpoint.
 *
 * Required environment variables (documented in .env.local.example):
 *   RESEND_API_KEY     Free tier at https://resend.com/api-keys (3,000 emails/month)
 *   RESEND_FROM        Verified sender, e.g. "Replete <hello@yourdomain>"
 *   NEXT_PUBLIC_APP_URL Public URL used in email links (http://localhost:3000 in dev)
 *
 * Without RESEND_API_KEY, signups still persist; emails are skipped.
 */

import { NextResponse } from "next/server";
import { appendWaitlistEntry } from "@/lib/storage";
import { rewriteEmailPlaceholders, sendEmail } from "@/lib/email-client";
import { welcomeEmail } from "@/lib/email-sequences";
import type { DeficiencyProfile, IntakeData } from "@/types";

export const runtime = "nodejs";

interface WaitlistRequest {
  email?: string;
  profile?: DeficiencyProfile;
  intakeData?: IntakeData;
}

const EMAIL_RE =
  /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;

export async function POST(req: Request): Promise<Response> {
  let payload: WaitlistRequest;
  try {
    payload = (await req.json()) as WaitlistRequest;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 },
    );
  }

  const email = (payload.email ?? "").trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { success: false, error: "Please enter a valid email." },
      { status: 400 },
    );
  }

  const count = await appendWaitlistEntry({
    email,
    timestamp: new Date().toISOString(),
    intake: payload.intakeData,
    profile: payload.profile,
  });

  let emailSent = false;
  let emailSkipped: "no-api-key" | undefined;
  if (payload.profile && payload.intakeData) {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
    const tpl = welcomeEmail(payload.profile, payload.intakeData);
    const rewritten = rewriteEmailPlaceholders(
      { html: tpl.html, text: tpl.text },
      { appUrl },
    );
    const result = await sendEmail({
      to: email,
      subject: tpl.subject,
      html: rewritten.html,
      text: rewritten.text,
    });
    emailSent = result.sent;
    emailSkipped = result.skipped;
  }

  return NextResponse.json({
    success: true,
    count,
    emailSent,
    emailSkipped,
  });
}
