/**
 * frontend/components/ResultDashboard.tsx
 * -----------------------------------------
 * Veritas Identity Screening Results Dashboard.
 * Recreates the Stitch "Hackathon Screening Results" editorial spec.
 * Tightened for professional desktop workstation density.
 */

"use client";

import { useEffect, useState } from "react";
import type { ScreeningResponse } from "@/types/screening";
import RiskBadge from "@/components/RiskBadge";

interface ResultDashboardProps {
  result: ScreeningResponse;
  passportPreview?: string | null;
  personPreview?: string | null;
}

export default function ResultDashboard({
  result,
  passportPreview,
  personPreview,
}: ResultDashboardProps) {
  const { extracted_data: data, validation, tampering, face_verification: face, risk } = result;

  const [timestamp, setTimestamp] = useState<string>("");

  useEffect(() => {
    const now = new Date();
    setTimestamp(
      now.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }) +
        ", " +
        now.toLocaleTimeString("en-GB", {
          hour: "2-digit",
          minute: "2-digit",
          timeZoneName: "short",
        })
    );
  }, []);

  const isFinalLow = result.final_decision === "LOW RISK";
  const ocrPct = Math.round(data.ocr_confidence * 100);
  const facePct = Math.round(face.similarity);
  const authenticityPurity = Math.max(0, Math.min(100, Math.round(100 - tampering.score)));

  // Format YYYY-MM-DD to "DD MMM YYYY"
  const formatDate = (iso: string) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return iso;
    }
  };

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  return (
    <div className="w-full flex flex-col gap-5 pb-10">
      {/* ── 1. Result Header / Session Bar ───────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b-2 border-on-background pb-3.5">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-on-background font-display uppercase tracking-tight">
            Screening Results
          </h2>
          <p className="font-mono text-xs text-on-surface-variant mt-0.5">
            <span>DOCUMENT TYPE: </span>
            <span className="font-bold text-on-background">{result.document.type.toUpperCase()}</span>
            {timestamp && <span> | {timestamp}</span>}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={handlePrint}
            className="flex-1 md:flex-none px-4 py-2 bg-surface border-2 border-on-background neo-shadow neo-shadow-hover font-mono text-xs uppercase tracking-wider font-bold text-on-background flex items-center justify-center gap-1.5"
            title="Print or save as PDF"
          >
            <span className="material-symbols-outlined text-sm">print</span>
            Export Report
          </button>
        </div>
      </div>

      {/* ── 2. Overall Risk Assessment Hero ───────────────────────────────── */}
      <div
        className={`w-full border-2 border-on-background shadow-[6px_6px_0px_0px_rgba(27,27,32,1)] p-4 md:p-6 lg:p-7 flex flex-col items-center justify-center text-center transition-colors ${
          isFinalLow ? "bg-secondary-fixed" : "bg-error-container"
        }`}
      >
        <div className="font-mono text-[11px] uppercase tracking-widest text-on-background font-bold mb-1.5">
          Overall Risk Assessment
        </div>
        <div className="text-2xl md:text-3xl lg:text-4xl font-bold text-on-background tracking-tight font-display uppercase">
          {result.final_decision}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2.5">
          <div className="px-3 py-1.5 border-2 border-on-background bg-surface font-mono text-xs font-bold inline-flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(27,27,32,1)]">
            <span
              className={`w-2.5 h-2.5 rounded-full border border-on-background shrink-0 ${
                isFinalLow ? "bg-[#10b981]" : "bg-[#ba1a1a]"
              }`}
            />
            <span>{isFinalLow ? "VERIFIED" : "REVIEW REQUIRED"}</span>
          </div>

          <div className="px-3 py-1.5 border-2 border-on-background bg-surface font-mono text-xs font-bold inline-flex items-center gap-2 shadow-[2px_2px_0px_0px_rgba(27,27,32,1)]">
            <span className="text-outline">RISK SCORE:</span>
            <span className="text-on-background">{risk.score.toFixed(0)} / 100</span>
            <span className="text-[11px] text-outline font-normal">({risk.level})</span>
          </div>
        </div>
      </div>

      {/* ── 3. Main Grid: Vectors & Media (Left) vs Profile & Findings (Right) ─ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6">
        {/* ── LEFT COLUMN (lg:col-span-5): Verification Vectors & Media ──── */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Verification Vectors */}
          <div className="border-2 border-on-background bg-surface neo-shadow flex flex-col">
            <div className="bg-on-background text-on-primary px-3.5 py-2.5 border-b-2 border-on-background font-mono text-xs uppercase tracking-widest font-bold flex items-center justify-between">
              <span>Verification Vectors</span>
              <span className="material-symbols-outlined text-sm">verified_user</span>
            </div>

            <div className="p-4 flex flex-col gap-3.5">
              {/* Vector 1: Document Authenticity / Validation */}
              <div className="flex flex-col border-b border-outline-variant pb-2.5 gap-1">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-on-surface-variant uppercase font-medium">Document Authenticity</span>
                  <RiskBadge level={validation.status} size="sm" />
                </div>
                <div className="w-full bg-surface-container h-1.5 border border-on-background overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      validation.status === "PASS"
                        ? "bg-[#10b981] w-full"
                        : validation.status === "WARNING"
                        ? "bg-[#f59e0b] w-2/3"
                        : "bg-[#ba1a1a] w-1/3"
                    }`}
                  />
                </div>
                <div className="text-[10px] font-mono text-on-surface-variant text-right">
                  {validation.issues.length === 0 ? "CONSISTENCY VERIFIED" : `${validation.issues.length} CONSISTENCY ISSUE(S)`}
                </div>
              </div>

              {/* Vector 2: Biometric Face Match */}
              <div className="flex flex-col border-b border-outline-variant pb-2.5 gap-1">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-on-surface-variant uppercase font-medium">Face Match</span>
                  <RiskBadge level={face.match ? "MATCH" : "MISMATCH"} size="sm" />
                </div>
                <div className="w-full bg-surface-container h-1.5 border border-on-background overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${face.match ? "bg-[#10b981]" : "bg-[#ba1a1a]"}`}
                    style={{ width: `${facePct}%` }}
                  />
                </div>
                <div className="text-[10px] font-mono text-on-surface-variant text-right">
                  {face.similarity.toFixed(1)}% SIMILARITY
                </div>
              </div>

              {/* Vector 3: Tampering Purity */}
              <div className="flex flex-col border-b border-outline-variant pb-2.5 gap-1">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-on-surface-variant uppercase font-medium">Tamper Forensic Check</span>
                  <RiskBadge level={tampering.status} size="sm" />
                </div>
                <div className="w-full bg-surface-container h-1.5 border border-on-background overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      tampering.status === "LOW"
                        ? "bg-[#10b981]"
                        : tampering.status === "MEDIUM"
                        ? "bg-[#f59e0b]"
                        : "bg-[#ba1a1a]"
                    }`}
                    style={{ width: `${authenticityPurity}%` }}
                  />
                </div>
                <div className="text-[10px] font-mono text-on-surface-variant text-right">
                  TAMPER SCORE: {tampering.score.toFixed(1)} / 100
                </div>
              </div>

              {/* Vector 4: OCR Extraction Confidence */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-on-surface-variant uppercase font-medium">OCR Extraction Confidence</span>
                  <span className="font-bold text-on-background">{ocrPct}%</span>
                </div>
                <div className="w-full bg-surface-container h-1.5 border border-on-background overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      ocrPct >= 80 ? "bg-[#10b981]" : ocrPct >= 60 ? "bg-[#f59e0b]" : "bg-[#ba1a1a]"
                    }`}
                    style={{ width: `${ocrPct}%` }}
                  />
                </div>
                <div className="text-[10px] font-mono text-on-surface-variant text-right">
                  CONFIDENCE SCORE: {data.ocr_confidence.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Captured Media Previews */}
          <div className="border-2 border-on-background bg-surface neo-shadow flex flex-col">
            <div className="bg-on-background text-on-primary px-3.5 py-2.5 border-b-2 border-on-background font-mono text-xs uppercase tracking-widest font-bold flex items-center justify-between">
              <span>Captured Media</span>
              <span className="material-symbols-outlined text-sm">perm_media</span>
            </div>

            <div className="p-4 flex flex-col gap-4">
              {/* Document Media Frame */}
              <div className="flex flex-col gap-1.5">
                <div className="border-2 border-on-background relative h-[125px] md:h-[135px] overflow-hidden bg-surface-container-low flex items-center justify-center">
                  {passportPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={passportPreview}
                      alt="Captured Identity Document"
                      className="w-full h-full object-contain p-1.5"
                    />
                  ) : (
                    <div className="text-center font-mono text-[11px] text-outline p-3">
                      [DOCUMENT IMAGE PREVIEW NOT AVAILABLE]
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-on-background text-on-primary px-2 py-0.5 font-mono text-[10px] opacity-95 border-t-2 border-on-background">
                    [DOC_FRONT_HQ_CAPTURED]
                  </div>
                </div>
              </div>

              {/* Person Photo Face Frame */}
              <div className="flex flex-col gap-1.5">
                <div className="border-2 border-on-background relative w-1/2 md:w-5/12 aspect-square max-h-[120px] mx-auto overflow-hidden bg-surface-container-low flex items-center justify-center">
                  {personPreview ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={personPreview}
                      alt="Captured Person Photo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center font-mono text-[10px] text-outline p-2">
                      [PHOTO NOT AVAILABLE]
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-on-background text-on-primary px-1.5 py-0.5 font-mono text-[10px] opacity-95 border-t-2 border-on-background text-center">
                    [LIVENESS_FRAME]
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN (lg:col-span-7): Profile & Findings ────────────── */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Identity Profile Extracted via OCR */}
          <div className="border-2 border-on-background bg-surface neo-shadow flex flex-col">
            <div className="bg-on-background text-on-primary px-3.5 py-2.5 border-b-2 border-on-background font-mono text-xs uppercase tracking-widest font-bold flex items-center justify-between">
              <span>Identity Profile Extracted via OCR</span>
              <span className="material-symbols-outlined text-sm">document_scanner</span>
            </div>

            <div className="p-4 md:p-5 grid grid-cols-1 md:grid-cols-2 gap-y-3.5 gap-x-6">
              {/* Name */}
              <div className="flex flex-col gap-0.5 border-b-2 border-on-background pb-1.5 md:col-span-2">
                <label className="font-mono text-[11px] text-on-surface-variant uppercase font-medium">
                  Full Legal Name
                </label>
                <span className="font-display text-lg md:text-xl font-bold text-on-background uppercase tracking-tight">
                  {data.name || "—"}
                </span>
              </div>

              {/* Passport / Document Number */}
              <div className="flex flex-col gap-0.5 border-b-2 border-on-background pb-1.5 md:col-span-2">
                <label className="font-mono text-[11px] text-on-surface-variant uppercase font-medium">
                  Document Number
                </label>
                <span className="font-mono text-base font-bold text-on-background tracking-widest">
                  {data.passport_number || "—"}
                </span>
              </div>

              {/* Nationality */}
              <div className="flex flex-col gap-0.5 border-b-2 border-on-background pb-1.5">
                <label className="font-mono text-[11px] text-on-surface-variant uppercase font-medium">
                  Nationality
                </label>
                <span className="font-display text-base font-bold text-on-background uppercase">
                  {data.nationality || "—"}
                </span>
              </div>

              {/* Gender */}
              <div className="flex flex-col gap-0.5 border-b-2 border-on-background pb-1.5">
                <label className="font-mono text-[11px] text-on-surface-variant uppercase font-medium">
                  Gender
                </label>
                <span className="font-display text-base font-bold text-on-background uppercase">
                  {data.gender === "M" ? "Male (M)" : data.gender === "F" ? "Female (F)" : data.gender || "—"}
                </span>
              </div>

              {/* Date of Birth */}
              <div className="flex flex-col gap-0.5 border-b-2 border-on-background pb-1.5">
                <label className="font-mono text-[11px] text-on-surface-variant uppercase font-medium">
                  Date of Birth
                </label>
                <span className="font-mono text-sm font-bold text-on-background">
                  {formatDate(data.dob)}
                </span>
              </div>

              {/* Expiry Date */}
              <div className="flex flex-col gap-0.5 border-b-2 border-on-background pb-1.5">
                <label className="font-mono text-[11px] text-on-surface-variant uppercase font-medium">
                  Expiration Date
                </label>
                <span className="font-mono text-sm font-bold text-on-background">
                  {formatDate(data.expiry)}
                </span>
              </div>
            </div>
          </div>

          {/* Forensic Tampering & Consistency Findings */}
          <div className="border-2 border-on-background bg-surface neo-shadow flex flex-col">
            <div className="bg-on-background text-on-primary px-3.5 py-2.5 border-b-2 border-on-background font-mono text-xs uppercase tracking-widest font-bold flex items-center justify-between">
              <span>Forensic & Consistency Findings</span>
              <span className="material-symbols-outlined text-sm">biotech</span>
            </div>

            <div className="p-4 flex flex-col gap-4">
              {/* Document Consistency Validation */}
              <div className="flex flex-col gap-2 border-b border-outline-variant pb-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider text-on-background">
                    Document Consistency Checks
                  </h4>
                  <RiskBadge level={validation.status} size="sm" />
                </div>
                {validation.issues.length === 0 ? (
                  <p className="font-mono text-xs text-emerald-800 bg-emerald-50 border border-emerald-300 p-2">
                    ✓ All logical validation rules satisfied (dates, formats, non-empty fields).
                  </p>
                ) : (
                  <ul className="space-y-1 font-mono text-xs text-error bg-error-container p-2.5 border border-error">
                    {validation.issues.map((issue, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span>⚠</span>
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Tampering Detection Analysis */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider text-on-background">
                    Tamper Forensic Indicators
                  </h4>
                  <RiskBadge level={tampering.status} size="sm" />
                </div>

                <div className="font-mono text-xs text-on-surface-variant leading-relaxed">
                  {tampering.status === "LOW"
                    ? "No significant tampering indicators detected across document boundaries or layout structure."
                    : tampering.status === "MEDIUM"
                    ? "Moderate visual anomalies or boundary artifacts detected. Manual review recommended."
                    : "Severe tampering indicators detected. Document integrity compromised."}
                </div>

                {tampering.issues.length > 0 && (
                  <ul className="space-y-1 font-mono text-xs text-on-background bg-surface-container p-2.5 border border-on-background">
                    {tampering.issues.map((issue, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span>•</span>
                        <span>{issue}</span>
                      </li>
                    ))}
                  </ul>
                )}

                {tampering.suspicious_regions.length > 0 && (
                  <div className="mt-0.5">
                    <span className="font-mono text-[10px] uppercase font-bold text-on-surface-variant block mb-1">
                      Flagged Regions:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {tampering.suspicious_regions.map((region, i) => (
                        <span
                          key={i}
                          className="font-mono text-[11px] px-2 py-0.5 bg-error-container text-error border border-error uppercase"
                        >
                          {region}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Risk Scoring Engine Breakdown */}
          <div className="border-2 border-on-background bg-surface neo-shadow flex flex-col">
            <div className="bg-on-background text-on-primary px-3.5 py-2.5 border-b-2 border-on-background font-mono text-xs uppercase tracking-widest font-bold flex items-center justify-between">
              <span>Risk Scoring Engine Reasons</span>
              <span className="material-symbols-outlined text-sm">analytics</span>
            </div>

            <div className="p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between border-b border-outline-variant pb-2">
                <span className="font-mono text-xs uppercase text-on-surface-variant">Combined Risk Assessment:</span>
                <div className="flex items-center gap-2">
                  <RiskBadge level={risk.level} size="sm" />
                  <span className="font-mono text-xs font-bold text-on-background">{risk.score.toFixed(0)} / 100</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="font-mono text-[11px] uppercase font-bold text-on-surface-variant block">
                  Signals Evaluated:
                </span>
                {risk.reasons.map((reason, i) => (
                  <div
                    key={i}
                    className={`font-mono text-xs p-2.5 border-2 border-on-background flex items-start gap-2 ${
                      isFinalLow ? "bg-surface-container" : "bg-error-container text-on-background"
                    }`}
                  >
                    <span className="shrink-0">{isFinalLow ? "ℹ" : "⚠"}</span>
                    <span>{reason}</span>
                  </div>
                ))}
              </div>

              <p className="font-mono text-[10px] text-outline mt-1">
                * Configurable risk scoring matrix applied across Biometric Similarity, Forensic Tampering, and Logical Checks.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Disclaimer ─────────────────────────────────────────────────── */}
      <div className="border-2 border-on-background bg-surface-container p-3 text-center font-mono text-[11px] text-on-surface-variant">
        🛡️ Veritas Identity is an AI-assisted hackathon prototype designed for demonstration purposes only.
        Not for official government or law-enforcement identity verification.
      </div>
    </div>
  );
}
