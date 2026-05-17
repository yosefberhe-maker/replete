import type { DeficiencyProfile, IntakeData } from "@/types";
import { getSupplementRecommendations } from "@/lib/supplement-data";
import { NUTRIENT_LABELS } from "@/lib/deficiency-engine";
import { DRUG_LABEL, DURATION_LABEL } from "@/lib/copy";

/**
 * Email content for the 5-step drip sequence. Each function returns a full
 * { subject, html, text } payload. HTML is inlined-style (the only place we
 * use inline styles — email clients ignore <style>).
 */

const BG = "#080C14";
const CARD = "#0F1623";
const TEXT = "#F1F5F9";
const SUB = "#94A3B8";
const GREEN = "#10B981";
const BORDER = "#1E293B";

export interface EmailPayload {
  subject: string;
  html: string;
  text: string;
}

function wrap(title: string, bodyHtml: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escape(title)}</title>
  </head>
  <body style="margin:0;padding:0;background:${BG};font-family:Inter,Arial,sans-serif;color:${TEXT};">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BG};padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:${CARD};border:1px solid ${BORDER};border-radius:14px;overflow:hidden;">
            <tr>
              <td style="padding:20px 24px;border-bottom:1px solid ${BORDER};">
                <span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${GREEN};vertical-align:middle;margin-right:8px;"></span>
                <span style="font-weight:800;letter-spacing:-0.2px;color:${TEXT};font-size:16px;">Replete</span>
              </td>
            </tr>
            <tr>
              <td style="padding:24px;line-height:1.55;color:${TEXT};font-size:15px;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 24px;border-top:1px solid ${BORDER};color:${SUB};font-size:11px;">
                Replete provides general nutritional information based on published clinical research. This is not medical advice.<br/>
                <a href="{{unsubscribe_url}}" style="color:${SUB};">Unsubscribe</a> · You're receiving this because you joined the Replete waitlist.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function topDeficiencies(
  profile: DeficiencyProfile,
  n = 3,
): { key: string; score: number; label: string }[] {
  return (Object.entries(profile) as [string, number | string][])
    .filter(([k]) => !["overallScore", "riskTier"].includes(k))
    .map(([k, v]) => ({
      key: k,
      score: Number(v),
      label: NUTRIENT_LABELS[k as keyof typeof NUTRIENT_LABELS] ?? k,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n);
}

export function welcomeEmail(
  profile: DeficiencyProfile,
  intake: IntakeData,
): EmailPayload {
  const top = topDeficiencies(profile, 3);
  const supplements = getSupplementRecommendations(profile, intake)
    .filter((s) => !s.foodOnly)
    .slice(0, 2);

  const top3Html = top
    .map(
      (t) =>
        `<li style="margin-bottom:6px;"><strong style="color:${TEXT}">${escape(t.label)}</strong> — risk score ${t.score} / 95</li>`,
    )
    .join("");

  const supplementsHtml = supplements
    .map(
      (s) => `
        <div style="border:1px solid ${BORDER};border-radius:10px;padding:14px;margin-top:10px;">
          <div style="font-weight:600;color:${TEXT};">${escape(s.name)}</div>
          <div style="color:${SUB};font-size:13px;margin-top:4px;">${escape(s.dose)} · ${escape(s.timing)}</div>
          <div style="color:${SUB};font-size:13px;margin-top:6px;">${escape(s.why)}</div>
        </div>`,
    )
    .join("");

  const subject = `Your ${DRUG_LABEL[intake.drug]} nutrition profile is ready`;

  const body = `
    <p style="margin:0 0 12px 0;font-size:18px;font-weight:700;color:${TEXT};">Your nutrition profile is ready.</p>
    <p style="margin:0 0 18px 0;color:${SUB};">You're on ${escape(DRUG_LABEL[intake.drug])}, ${escape(DURATION_LABEL[intake.duration].toLowerCase())}. Here's the short version.</p>

    <p style="margin:0 0 6px 0;font-weight:600;color:${TEXT};">Your top 3 deficiency risks</p>
    <ol style="margin:0 0 18px 18px;padding:0;color:${SUB};">${top3Html}</ol>

    <p style="margin:0 0 6px 0;font-weight:600;color:${TEXT};">Top 2 supplements to start with</p>
    ${supplementsHtml}

    <p style="margin:18px 0 6px 0;font-weight:600;color:${TEXT};">One meal tip for this week</p>
    <p style="margin:0 0 18px 0;color:${SUB};">Lead every meal with protein. On a GLP-1, your appetite is the scarcest resource — spend it on the highest-leverage macro first.</p>

    <p style="margin:24px 0 0 0;">
      <a href="{{app_url}}/results" style="display:inline-block;background:${GREEN};color:${BG};font-weight:700;padding:12px 18px;border-radius:10px;text-decoration:none;">View my full plan</a>
    </p>
  `;

  return {
    subject,
    html: wrap(subject, body),
    text: `Your ${DRUG_LABEL[intake.drug]} nutrition profile is ready.\n\nTop deficiency risks: ${top.map((t) => `${t.label} (${t.score}/95)`).join(", ")}.\nStart with: ${supplements.map((s) => s.name).join(", ")}.\n\nView your full plan: {{app_url}}/results`,
  };
}

export function day3Email(): EmailPayload {
  const subject = "The #1 mistake GLP-1 users make with protein";
  const body = `
    <p style="margin:0 0 12px 0;font-size:18px;font-weight:700;color:${TEXT};">Your protein needs didn't drop. Your protein intake did.</p>
    <p style="margin:0 0 16px 0;color:${SUB};">The most documented downside of GLP-1s isn't the side effects — it's lean mass loss. ~45% of weight lost in the STEP 1 semaglutide trial came from lean tissue (PMC8089287); SURMOUNT-1 tirzepatide came in lower at ~25% (PMC11965027). Either way, it's the part of the story nobody flags up front.</p>
    <p style="margin:0 0 16px 0;color:${SUB};">The fix is unglamorous: aim for 1.2–2.0 g of protein per kg of body weight (~0.55–0.9 g per pound), every day, regardless of how little you feel like eating. Whey, Greek yogurt, eggs, fish, cottage cheese — anything that gives you 25 g in a small volume.</p>
    <p style="margin:0 0 0 0;">
      <a href="{{app_url}}/results" style="color:${GREEN};text-decoration:underline;">See your protein recommendation →</a>
    </p>
  `;
  return {
    subject,
    html: wrap(subject, body),
    text: "The #1 mistake GLP-1 users make is letting protein drop with calories. Aim for 1.2-2.0 g per kg of body weight (~0.55-0.9 g/lb) daily. See your protein recommendation: {{app_url}}/results",
  };
}

export function day7Email(): EmailPayload {
  const subject = "Why your hair might be thinning (and what to do)";
  const body = `
    <p style="margin:0 0 12px 0;font-size:18px;font-weight:700;color:${TEXT};">Hair thinning on GLP-1s is real — and predictable.</p>
    <p style="margin:0 0 16px 0;color:${SUB};">Hair growth depends on three things you cut on a GLP-1: total calories, protein, and trace minerals — especially zinc and iron. The shedding usually starts around month 3, peaks around month 6, and resolves once you close the gap.</p>
    <p style="margin:0 0 8px 0;color:${TEXT};font-weight:600;">The fix is a stack, not a single nutrient:</p>
    <ul style="margin:0 0 16px 18px;padding:0;color:${SUB};">
      <li style="margin-bottom:6px;">Protein at 1.2–2.0 g/kg body weight (~0.55–0.9 g/lb)</li>
      <li style="margin-bottom:6px;">Zinc picolinate 25 mg/day with food</li>
      <li style="margin-bottom:6px;">Iron bisglycinate 18–36 mg/day (with vitamin C, away from coffee)</li>
    </ul>
    <p style="margin:0 0 0 0;color:${SUB};">If you've been shedding for more than 4 months, ask your doctor for a ferritin lab — low iron stores are the most common reversible cause.</p>
  `;
  return {
    subject,
    html: wrap(subject, body),
    text: "Hair thinning on GLP-1s correlates with zinc, iron, and protein. Stack: protein 1.2-2.0 g/kg body weight (~0.55-0.9 g/lb) + zinc 25mg + iron bisglycinate 18-36mg with vitamin C.",
  };
}

export function day14Email(
  profile: DeficiencyProfile,
  intake: IntakeData,
): EmailPayload {
  const recs = getSupplementRecommendations(profile, intake)
    .filter((s) => !s.foodOnly)
    .slice(0, 5);
  const items = recs
    .map(
      (s) => `
        <div style="border:1px solid ${BORDER};border-radius:10px;padding:14px;margin-top:10px;">
          <div style="display:flex;justify-content:space-between;gap:8px;">
            <span style="font-weight:600;color:${TEXT};">${escape(s.name)}</span>
            <span style="font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:${GREEN};">${s.priority}</span>
          </div>
          <div style="color:${SUB};font-size:13px;margin-top:4px;">${escape(s.dose)} · ${escape(s.timing)}</div>
          <div style="color:${SUB};font-size:13px;margin-top:6px;">${escape(s.form)}</div>
        </div>`,
    )
    .join("");

  const subject = "Your personalized supplement stack — ranked";
  const body = `
    <p style="margin:0 0 12px 0;font-size:18px;font-weight:700;color:${TEXT};">Your stack, by priority.</p>
    <p style="margin:0 0 16px 0;color:${SUB};">This is your top 5, ranked by your specific deficiency scores. Forms matter — most GLP-1 users default to oxide-form magnesium and ferrous sulfate, both of which cause GI distress and have poor absorption. The forms below are the ones that actually work on a slow-emptying stomach.</p>
    ${items}
    <p style="margin:18px 0 0 0;color:${SUB};font-size:12px;">Always confirm with your prescriber before starting iron, especially if you've never been tested for ferritin.</p>
  `;
  return {
    subject,
    html: wrap(subject, body),
    text: `Your top supplements, ranked: ${recs.map((s) => `${s.name} (${s.priority})`).join(", ")}.`,
  };
}

export function day30Email(): EmailPayload {
  const subject = "30 days in — how is your energy?";
  const body = `
    <p style="margin:0 0 12px 0;font-size:18px;font-weight:700;color:${TEXT};">Quick check-in.</p>
    <p style="margin:0 0 16px 0;color:${SUB};">If you've been on the supplement stack for ~30 days, three things should be measurably different:</p>
    <ol style="margin:0 0 18px 18px;padding:0;color:${SUB};">
      <li style="margin-bottom:6px;">Less afternoon fatigue (B12 + iron starting to work)</li>
      <li style="margin-bottom:6px;">Better sleep (magnesium glycinate)</li>
      <li style="margin-bottom:6px;">Less leg cramping or jaw clenching (magnesium + potassium from food)</li>
    </ol>
    <p style="margin:0 0 16px 0;color:${SUB};">If your dose has changed since you took the intake, re-run it — your deficiency profile shifts with each dose escalation.</p>
    <p style="margin:0 0 0 0;">
      <a href="{{app_url}}/intake" style="display:inline-block;background:${GREEN};color:${BG};font-weight:700;padding:12px 18px;border-radius:10px;text-decoration:none;">Re-run my intake</a>
    </p>
  `;
  return {
    subject,
    html: wrap(subject, body),
    text: "30 days in — has your fatigue, sleep, or cramping improved? Re-run your intake if your dose changed: {{app_url}}/intake",
  };
}
