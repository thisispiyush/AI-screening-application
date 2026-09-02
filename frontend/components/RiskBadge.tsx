/**
 * frontend/components/RiskBadge.tsx
 * ----------------------------------
 * Neo-Brutalist Status Badge with colored status indicator dot.
 * Styled to match the Veritas Identity / Stitch design language with dense desktop scaling.
 */

import type { RiskLevel, ValidationStatus } from "@/types/screening";

type BadgeLevel = RiskLevel | ValidationStatus | "MATCH" | "MISMATCH" | string;

interface RiskBadgeProps {
  level: BadgeLevel;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const DOT_COLORS: Record<string, string> = {
  LOW: "bg-[#10b981]",
  PASS: "bg-[#10b981]",
  MATCH: "bg-[#10b981]",
  MEDIUM: "bg-[#f59e0b]",
  WARNING: "bg-[#f59e0b]",
  HIGH: "bg-[#ba1a1a]",
  FAIL: "bg-[#ba1a1a]",
  MISMATCH: "bg-[#ba1a1a]",
};

export default function RiskBadge({ level, size = "md", className = "" }: RiskBadgeProps) {
  const key = level?.toUpperCase() ?? "UNKNOWN";
  const dot = DOT_COLORS[key] ?? "bg-[#747688]";

  const sizeClasses =
    size === "sm"
      ? "px-1.5 py-0.2 text-[10px] gap-1.5"
      : size === "lg"
      ? "px-3 py-1 text-xs gap-2"
      : "px-2 py-0.5 text-[11px] gap-1.5";

  const dotSize =
    size === "sm" ? "w-1.5 h-1.5" : size === "lg" ? "w-2.5 h-2.5" : "w-2 h-2";

  return (
    <span
      className={`inline-flex items-center font-mono font-bold uppercase tracking-wider border-2 border-on-background bg-surface text-on-background shadow-[1.5px_1.5px_0px_0px_rgba(27,27,32,1)] ${sizeClasses} ${className}`}
    >
      <span className={`${dotSize} rounded-full border border-on-background shrink-0 ${dot}`} />
      <span>{key}</span>
    </span>
  );
}
