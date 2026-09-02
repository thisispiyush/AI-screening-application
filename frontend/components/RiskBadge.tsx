/**
 * frontend/components/RiskBadge.tsx
 * ----------------------------------
 * A coloured badge chip that shows LOW / MEDIUM / HIGH risk/status.
 *
 * Props:
 *   level   — "LOW" | "MEDIUM" | "HIGH"
 *   size    — "sm" | "md" (default "md")
 */

import type { RiskLevel, ValidationStatus } from "@/types/screening";

type BadgeLevel = RiskLevel | ValidationStatus | string;

interface RiskBadgeProps {
  level: BadgeLevel;
  size?: "sm" | "md";
}

const STYLES: Record<string, string> = {
  LOW:     "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40",
  MEDIUM:  "bg-amber-500/20   text-amber-300   border border-amber-500/40",
  HIGH:    "bg-red-500/20     text-red-300     border border-red-500/40",
  PASS:    "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40",
  WARNING: "bg-amber-500/20   text-amber-300   border border-amber-500/40",
  FAIL:    "bg-red-500/20     text-red-300     border border-red-500/40",
  MATCH:   "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40",
  MISMATCH:"bg-red-500/20     text-red-300     border border-red-500/40",
};

const DOTS: Record<string, string> = {
  LOW:     "bg-emerald-400",
  MEDIUM:  "bg-amber-400",
  HIGH:    "bg-red-400",
  PASS:    "bg-emerald-400",
  WARNING: "bg-amber-400",
  FAIL:    "bg-red-400",
  MATCH:   "bg-emerald-400",
  MISMATCH:"bg-red-400",
};

export default function RiskBadge({ level, size = "md" }: RiskBadgeProps) {
  const key = level?.toUpperCase() ?? "UNKNOWN";
  const style = STYLES[key] ?? "bg-slate-500/20 text-slate-300 border border-slate-500/40";
  const dot   = DOTS[key]  ?? "bg-slate-400";

  const textSize  = size === "sm" ? "text-xs" : "text-sm";
  const padding   = size === "sm" ? "px-2 py-0.5" : "px-3 py-1";
  const dotSize   = size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2";

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full font-semibold tracking-wide ${textSize} ${padding} ${style}`}>
      <span className={`rounded-full ${dotSize} ${dot}`} />
      {key}
    </span>
  );
}
