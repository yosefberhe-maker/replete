import Link from "next/link";
import { ShieldCheck } from "lucide-react";

/**
 * Trust signal — not a disclaimer. Lives near the top of the results page.
 * Links to /about for users who want the full clinical standards page.
 */
export default function ReviewedBadge() {
  return (
    <Link
      href="/about"
      className="inline-flex items-center gap-1.5 rounded-full border border-green/30 bg-green/5 px-3 py-1.5 text-xs font-semibold text-green transition-colors hover:bg-green/10"
    >
      <ShieldCheck className="h-3.5 w-3.5" />
      Content reviewed by a Registered Dietitian
    </Link>
  );
}
