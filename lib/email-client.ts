import { Resend } from "resend";

/**
 * Resend wrapper. If RESEND_API_KEY is missing we no-op gracefully so
 * the local dev experience isn't blocked. Document the env var in
 * .env.local.example.
 */

interface SendArgs {
  to: string;
  subject: string;
  html: string;
  text: string;
}

interface SendResult {
  sent: boolean;
  /** Reason we skipped, if not sent. */
  skipped?: "no-api-key";
  id?: string;
  error?: string;
}

const FROM = process.env.RESEND_FROM ?? "Replete <onboarding@resend.dev>";

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendArgs): Promise<SendResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    return { sent: false, skipped: "no-api-key" };
  }
  try {
    const resend = new Resend(key);
    const result = await resend.emails.send({
      from: FROM,
      to,
      subject,
      html,
      text,
    });
    if (result.error) {
      return { sent: false, error: result.error.message };
    }
    return { sent: true, id: result.data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return { sent: false, error: message };
  }
}

export function rewriteEmailPlaceholders(
  payload: { html: string; text: string },
  vars: { appUrl: string; unsubscribeUrl?: string },
): { html: string; text: string } {
  const unsubscribe = vars.unsubscribeUrl ?? `${vars.appUrl}/unsubscribe`;
  const replace = (s: string) =>
    s
      .replaceAll("{{app_url}}", vars.appUrl)
      .replaceAll("{{unsubscribe_url}}", unsubscribe);
  return { html: replace(payload.html), text: replace(payload.text) };
}
