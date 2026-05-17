import { ShieldCheck } from "lucide-react";

/**
 * Inline disclaimer copy. Not a modal — meant to feel warm and trustworthy
 * rather than CYA. Final wording is pending from clinical/legal review;
 * keep the placeholder language unless told otherwise.
 */

interface DisclaimerProps {
  variant: "inline" | "footer" | "results";
  className?: string;
}

const RESULTS_COPY = (
  <>
    <span className="font-semibold text-text">
      Content reviewed by a registered dietitian.
    </span>{" "}
    Replete provides evidence-based nutritional information — it is not
    medical nutrition therapy or a substitute for personalized medical
    advice from your prescribing provider. Talk to them before adding any
    supplement, especially if you have a pre-existing condition or take
    medication that interacts with the items above.
  </>
);

const INLINE_COPY =
  "Educational guidance reviewed by a registered dietitian — not a substitute for personalized medical nutrition therapy from your prescribing provider.";

const FOOTER_COPY =
  "Replete provides evidence-based nutritional information reviewed by a registered dietitian. This is not medical nutrition therapy or a substitute for advice from your healthcare provider.";

export default function Disclaimer({ variant, className }: DisclaimerProps) {
  if (variant === "footer") {
    return (
      <p
        className={`text-center text-xs text-muted ${className ?? ""}`}
      >
        {FOOTER_COPY}
      </p>
    );
  }

  if (variant === "inline") {
    return (
      <p className={`text-xs text-muted ${className ?? ""}`}>{INLINE_COPY}</p>
    );
  }

  return (
    <aside
      className={`rounded-xl border border-border bg-card/60 p-5 text-sm text-sub ${
        className ?? ""
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-green/15 text-green"
          aria-hidden
        >
          <ShieldCheck className="h-4 w-4" />
        </span>
        <p>{RESULTS_COPY}</p>
      </div>
    </aside>
  );
}
