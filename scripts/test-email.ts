/**
 * scripts/test-email.ts
 *
 * Send a test welcome email to verify the Resend integration.
 *
 * Usage:
 *   RESEND_API_KEY=re_xxx pnpm tsx scripts/test-email.ts you@example.com
 *
 * Or with a default recipient:
 *   RESEND_API_KEY=re_xxx pnpm tsx scripts/test-email.ts
 */

import { rewriteEmailPlaceholders, sendEmail } from "../lib/email-client";
import { welcomeEmail } from "../lib/email-sequences";
import { calculateDeficiencies } from "../lib/deficiency-engine";
import type { IntakeData } from "../types";

const DEFAULT_RECIPIENT = "yosef@example.com";

async function main(): Promise<void> {
  const to = process.argv[2] ?? DEFAULT_RECIPIENT;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const intake: IntakeData = {
    drug: "sema",
    duration: "6-12",
    dose: "moderate",
    diet: "omni",
    symptoms: ["fatigue", "hairloss"],
    sex: "female",
    ageRange: "35-49",
    activityLevel: "moderate",
    weightLbs: 175,
    injectionDay: "mon",
    injectionTiming: "morning",
  };
  const profile = calculateDeficiencies(intake);
  const tpl = welcomeEmail(profile, intake);
  const rewritten = rewriteEmailPlaceholders(
    { html: tpl.html, text: tpl.text },
    { appUrl },
  );

  console.log(`Sending test welcome email to ${to}...`);
  const result = await sendEmail({
    to,
    subject: tpl.subject,
    html: rewritten.html,
    text: rewritten.text,
  });

  if (result.skipped === "no-api-key") {
    console.error(
      "RESEND_API_KEY is not set. Add it to .env.local (see .env.local.example) and re-run.",
    );
    process.exit(1);
  }
  if (!result.sent) {
    console.error("Failed to send:", result.error);
    process.exit(1);
  }
  console.log("Sent. Resend id:", result.id);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
