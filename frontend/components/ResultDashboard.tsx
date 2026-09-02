/**
 * frontend/components/ResultDashboard.tsx
 * -----------------------------------------
 * Renders the complete screening result after the API returns.
 *
 * Each section maps to one part of the ScreeningResponse JSON:
 *   - Personal Information (extracted_data)
 *   - OCR Confidence
 *   - Document Validation (validation)
 *   - Tampering Analysis (tampering)
 *   - Face Verification (face_verification)
 *   - Risk Assessment (risk)
 *   - Final Decision
 */

"use client";

import type { ScreeningResponse } from "@/types/screening";
import StatusCard from "@/components/StatusCard";
import RiskBadge from "@/components/RiskBadge";

interface ResultDashboardProps {
  result: ScreeningResponse;
  passportPreview?: string | null;
  personPreview?:  string | null;
}

// ─── Helper: small label-value row ────────────────────────────────────────────

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start py-2.5 border-b border-white/5 last:border-0">
      <span className="text-slate-400 text-sm">{label}</span>
      <span className="text-white text-sm font-medium text-right max-w-[60%] break-words">
        {value || "—"}
      </span>
    </div>
  );
}

// ─── Helper: circular score ring ──────────────────────────────────────────────

function ScoreRing({
  score,
  max = 100,
  level,
}: {
  score: number;
  max?: number;
  level: string;
}) {
  const pct = Math.min((score / max) * 100, 100);
  const radius  = 36;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (pct / 100) * circumference;

  const color =
    level === "LOW"    ? "#34d399" :
    level === "MEDIUM" ? "#fbbf24" :
                         "#f87171";

  return (
    <div className="relative flex items-center justify-center w-24 h-24">
      <svg className="-rotate-90" width="96" height="96" viewBox="0 0 96 96">
        {/* Track */}
        <circle
          cx="48" cy="48" r={radius}
          fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8"
        />
        {/* Progress */}
        <circle
          cx="48" cy="48" r={radius}
          fill="none" stroke={color} strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-xl font-bold text-white">{score.toFixed(0)}</div>
        <div className="text-xs text-slate-400">/ {max}</div>
      </div>
    </div>
  );
}

// ─── Helper: percentage bar ───────────────────────────────────────────────────

function PercentBar({ value, color = "#34d399" }: { value: number; color?: string }) {
  return (
    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-1000"
        style={{ width: `${Math.min(value, 100)}%`, backgroundColor: color }}
      />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ResultDashboard({
  result,
  passportPreview,
  personPreview,
}: ResultDashboardProps) {
  const { extracted_data: data, validation, tampering, face_verification: face, risk } = result;

  const isLowRisk   = risk.level === "LOW";
  const isFinalLow  = result.final_decision === "LOW RISK";

  const ocrPct      = Math.round(data.ocr_confidence * 100);
  const facePct     = Math.round(face.similarity);

  // Format YYYY-MM-DD to "DD MMM YYYY" for display
  const formatDate = (iso: string) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString("en-GB", {
        day: "2-digit", month: "short", year: "numeric"
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-16">

      {/* ── Final Decision Banner ─────────────────────────────────────────── */}
      <div className={`
        relative overflow-hidden rounded-2xl p-6
        flex items-center justify-between gap-4
        border
        ${isFinalLow
          ? "bg-emerald-500/10 border-emerald-500/30"
          : "bg-red-500/10    border-red-500/30"
        }
      `}>
        {/* glow */}
        <div className={`
          absolute inset-0 pointer-events-none
          ${isFinalLow
            ? "bg-[radial-gradient(ellipse_at_top-left,rgba(52,211,153,0.12),transparent_60%)]"
            : "bg-[radial-gradient(ellipse_at_top-left,rgba(248,113,113,0.12),transparent_60%)]"
          }
        `} />
        <div>
          <p className="text-xs text-slate-400 uppercase tracking-widest font-semibold mb-1">
            Final Decision
          </p>
          <h1 className={`text-2xl font-bold tracking-tight ${isFinalLow ? "text-emerald-300" : "text-red-300"}`}>
            {result.final_decision}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            This is an AI-assisted prototype screening result — not an official verification.
          </p>
        </div>
        <div className="text-4xl shrink-0">
          {isFinalLow ? "✅" : "⚠️"}
        </div>
      </div>

      {/* ── Grid: two columns on desktop ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ── Personal Information ─────────────────────────────────────────── */}
        <StatusCard title="Personal Information" icon="🪪">
          <InfoRow label="Full Name"       value={data.name} />
          <InfoRow label="Passport No."    value={data.passport_number} />
          <InfoRow label="Nationality"     value={data.nationality} />
          <InfoRow label="Date of Birth"   value={formatDate(data.dob)} />
          <InfoRow label="Expiry Date"     value={formatDate(data.expiry)} />
          <InfoRow label="Gender"          value={data.gender === "M" ? "Male" : data.gender === "F" ? "Female" : data.gender} />
        </StatusCard>

        {/* ── OCR Confidence + Document Photos ─────────────────────────────── */}
        <StatusCard title="OCR Confidence" icon="🔍">
          <div className="flex items-center justify-between mb-3">
            <span className="text-slate-300 text-sm">Extraction confidence</span>
            <span className={`text-lg font-bold ${ocrPct >= 80 ? "text-emerald-400" : ocrPct >= 60 ? "text-amber-400" : "text-red-400"}`}>
              {ocrPct}%
            </span>
          </div>
          <PercentBar
            value={ocrPct}
            color={ocrPct >= 80 ? "#34d399" : ocrPct >= 60 ? "#fbbf24" : "#f87171"}
          />
          <p className="text-xs text-slate-500 mt-3">
            Higher confidence means the OCR extracted text more reliably from the document image.
          </p>

          {/* Thumbnail previews */}
          {(passportPreview || personPreview) && (
            <div className="flex gap-3 mt-5">
              {passportPreview && (
                <div className="flex-1">
                  <p className="text-xs text-slate-500 mb-1">Passport</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={passportPreview} alt="Passport" className="rounded-lg w-full h-20 object-cover border border-white/10" />
                </div>
              )}
              {personPreview && (
                <div className="flex-1">
                  <p className="text-xs text-slate-500 mb-1">Person Photo</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={personPreview} alt="Person" className="rounded-lg w-full h-20 object-cover border border-white/10" />
                </div>
              )}
            </div>
          )}
        </StatusCard>

        {/* ── Document Validation ───────────────────────────────────────────── */}
        <StatusCard title="Document Validation" icon="📋">
          <div className="flex items-center gap-3 mb-4">
            <RiskBadge level={validation.status} />
            <span className="text-slate-400 text-sm">
              {validation.issues.length === 0
                ? "All prototype consistency checks passed."
                : `${validation.issues.length} issue(s) found.`
              }
            </span>
          </div>
          {validation.issues.length > 0 && (
            <ul className="space-y-2">
              {validation.issues.map((issue, i) => (
                <li key={i} className="flex gap-2 text-sm text-amber-200/80">
                  <span className="shrink-0 mt-0.5">⚠️</span>
                  <span>{issue}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-slate-600 mt-4">
            Prototype consistency checks only — not official government validation rules.
          </p>
        </StatusCard>

        {/* ── Tampering Analysis ────────────────────────────────────────────── */}
        <StatusCard title="Tampering Analysis" icon="🔬">
          <div className="flex items-center gap-6 mb-5">
            <ScoreRing score={tampering.score} level={tampering.status} />
            <div>
              <RiskBadge level={tampering.status} />
              <p className="text-slate-400 text-sm mt-2">
                {tampering.status === "LOW"
                  ? "No significant tampering indicators detected."
                  : tampering.status === "MEDIUM"
                  ? "Some anomalies detected — worth reviewing."
                  : "Strong tampering indicators — review carefully."
                }
              </p>
            </div>
          </div>
          {tampering.issues.length > 0 && (
            <div className="space-y-2 mb-3">
              {tampering.issues.map((issue, i) => (
                <div key={i} className="flex gap-2 text-sm text-slate-300">
                  <span className="shrink-0">•</span>
                  <span>{issue}</span>
                </div>
              ))}
            </div>
          )}
          {tampering.suspicious_regions.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-2">Suspicious Regions:</p>
              <div className="flex flex-wrap gap-2">
                {tampering.suspicious_regions.map((r, i) => (
                  <span key={i} className="text-xs bg-red-500/10 text-red-300 border border-red-500/20 px-2 py-0.5 rounded-full">
                    {r}
                  </span>
                ))}
              </div>
            </div>
          )}
          <p className="text-xs text-slate-600 mt-4">
            AI-assisted estimate — not a forensic conclusion.
          </p>
        </StatusCard>

        {/* ── Face Verification ─────────────────────────────────────────────── */}
        <StatusCard title="Face Verification" icon="👤">
          <div className="flex items-center gap-6 mb-4">
            <ScoreRing
              score={facePct}
              level={face.match ? "LOW" : "HIGH"}
            />
            <div>
              <RiskBadge level={face.match ? "MATCH" : "MISMATCH"} />
              <p className="text-slate-400 text-sm mt-2">
                Similarity between passport photo and person photo:{" "}
                <span className="text-white font-semibold">{facePct}%</span>
              </p>
            </div>
          </div>
          <PercentBar
            value={facePct}
            color={face.match ? "#34d399" : "#f87171"}
          />
          <p className="text-xs text-slate-600 mt-4">
            AI-assisted face comparison — not a certified biometric identity verification.
          </p>
        </StatusCard>

        {/* ── Risk Assessment ───────────────────────────────────────────────── */}
        <StatusCard title="Risk Assessment" icon="⚡">
          <div className="flex items-center gap-6 mb-5">
            <ScoreRing score={risk.score} level={risk.level} />
            <div>
              <RiskBadge level={risk.level} size="md" />
              <p className="text-slate-400 text-sm mt-2">
                Combined risk score from all signals.
              </p>
            </div>
          </div>

          {/* Reasons */}
          <div className="space-y-2">
            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">
              Scoring Reasons
            </p>
            {risk.reasons.map((reason, i) => (
              <div
                key={i}
                className={`flex gap-2 text-sm rounded-lg px-3 py-2 ${
                  isLowRisk ? "bg-white/5 text-slate-300" : "bg-red-500/5 text-red-200/70"
                }`}
              >
                <span className="shrink-0">{isLowRisk ? "ℹ️" : "⚠️"}</span>
                <span>{reason}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-600 mt-4">
            Prototype scoring model — weights are configurable in risk_engine.py.
          </p>
        </StatusCard>
      </div>

      {/* ── Disclaimer ───────────────────────────────────────────────────────── */}
      <div className="rounded-xl border border-white/5 bg-white/3 p-4 text-center">
        <p className="text-xs text-slate-600">
          🛡️ This system is an AI-assisted hackathon prototype for demonstration only.
          Results should not be used to make real decisions about real people or documents.
        </p>
      </div>
    </div>
  );
}
