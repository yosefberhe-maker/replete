import Link from "next/link";
import { cn } from "@/lib/utils";

interface WordmarkProps {
  className?: string;
  size?: "sm" | "md";
}

export function RepleteWordmark({ className, size = "md" }: WordmarkProps) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-2 font-extrabold tracking-tight text-text",
        size === "sm" ? "text-base" : "text-lg",
        className,
      )}
    >
      <span className="inline-block h-2.5 w-2.5 rounded-full bg-green" />
      Replete
    </Link>
  );
}
