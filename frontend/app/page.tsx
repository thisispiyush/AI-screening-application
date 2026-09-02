/**
 * frontend/app/page.tsx
 * ----------------------
 * Landing page — Veritas Identity AI Document Screening System.
 * Compact desktop density & refined scale matching the Stitch design language.
 */

"use client";

import { useState, useCallback } from "react";
import UploadZone from "@/components/UploadZone";
import ResultDashboard from "@/components/ResultDashboard";
import { analyzeDocuments } from "@/lib/api";
import type { ScreeningResponse, UploadFiles } from "@/types/screening";

type PageState = "idle" | "loading" | "result" | "error";

export default function HomePage() {
  // ── File state ──────────────────────────────────────────────────────────────
  const [files, setFiles] = useState<UploadFiles>({
    passport: null,
    visa: null,
    personPhoto: null,
  });

  // Preview object URLs (generated client-side for display)
  const [previews, setPreviews] = useState<{
    passport: string | null;
    visa: string | null;
    personPhoto: string | null;
  }>({ passport: null, visa: null, personPhoto: null });

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [pageState, setPageState] = useState<PageState>("idle");
  const [result, setResult] = useState<ScreeningResponse | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");

  // ── File change handler ──────────────────────────────────────────────────────
  const handleFileChange = useCallback(
    (field: keyof UploadFiles) => (file: File | null) => {
      setFiles((prev) => ({ ...prev, [field]: file }));

      // Revoke old preview URL to free memory
      setPreviews((prev) => {
        if (prev[field]) URL.revokeObjectURL(prev[field]!);
        return {
          ...prev,
          [field]: file ? URL.createObjectURL(file) : null,
        };
      });
    },
    []
  );

  // ── Form submission ──────────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    // Client-side required-field check
    if (!files.passport) {
      setErrorMsg("Please upload an Identity Document (Passport).");
      setPageState("error");
      return;
    }
    if (!files.personPhoto) {
      setErrorMsg("Please upload a Person Photo (Live Selfie or Face Shot).");
      setPageState("error");
      return;
    }

    setPageState("loading");
    setErrorMsg("");

    try {
      const data = await analyzeDocuments(
        files.passport,
        files.personPhoto,
        files.visa
      );
      setResult(data);
      setPageState("result");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "An unexpected error occurred.");
      setPageState("error");
    }
  };

  // ── Reset ────────────────────────────────────────────────────────────────────
  const handleReset = () => {
    setFiles({ passport: null, visa: null, personPhoto: null });
    setPreviews({ passport: null, visa: null, personPhoto: null });
    setResult(null);
    setPageState("idle");
    setErrorMsg("");
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex flex-col bg-background text-on-background">
      {/* ── TopAppBar / Masthead ───────────────────────────────────────────── */}
      <header className="w-full top-0 sticky z-50 bg-background border-b-2 border-on-background neo-shadow transition-all">
        <div className="flex justify-between items-center w-full px-4 md:px-8 py-2.5 md:py-3 max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="text-xl md:text-2xl font-bold tracking-tight text-primary uppercase font-display">
              Veritas Identity
            </span>
            <span className="hidden sm:inline-block text-[10px] font-mono uppercase bg-primary-fixed text-on-background px-2 py-0.5 border border-on-background font-bold">
              Screening System
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center p-1.5 border-2 border-on-background neo-shadow-sm bg-surface"
              title="System Security Integrity Active"
            >
              <span className="material-symbols-outlined text-on-background block text-lg">security</span>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main Content Area ───────────────────────────────────────────────── */}
      <main className="flex-grow w-full max-w-6xl mx-auto px-4 md:px-8 py-5 md:py-7">
        {pageState === "result" && result ? (
          /* ── Result Dashboard View ────────────────────────────────────────── */
          <div className="animate-fade-in-up">
            <div className="mb-5 flex items-center justify-between">
              <button
                id="analyze-new-btn"
                onClick={handleReset}
                className="px-4 py-2 bg-surface border-2 border-on-background neo-shadow neo-shadow-hover font-mono text-xs uppercase tracking-wider font-bold text-on-background flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Analyze New Document
              </button>
              <div className="font-mono text-xs text-on-surface-variant uppercase">
                Status: Complete
              </div>
            </div>

            <ResultDashboard
              result={result}
              passportPreview={previews.passport}
              personPreview={previews.personPhoto}
            />
          </div>
        ) : (
          /* ── Idle / Upload View (Stitch Spec) ─────────────────────────────── */
          <div>
            {/* Headline */}
            <div className="mb-5 md:mb-6">
              <h1 className="text-2xl md:text-4xl font-bold text-on-background uppercase tracking-tight font-display">
                AI Identity Document Screening
              </h1>
              <p className="text-xs md:text-sm font-mono text-on-surface-variant mt-1">
                Automated forensic validation & biometric verification pipeline. Prototype for demo purposes.
              </p>
            </div>

            {/* Error Notification Banner */}
            {pageState === "error" && errorMsg && (
              <div
                role="alert"
                className="mb-5 border-2 border-on-background bg-error-container p-3.5 neo-shadow flex items-start justify-between gap-3"
              >
                <div className="flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-error text-xl shrink-0">error</span>
                  <div>
                    <h4 className="font-bold text-error uppercase font-mono text-xs">Action Required</h4>
                    <p className="text-xs font-mono text-on-background mt-0.5">{errorMsg}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setErrorMsg("")}
                  className="text-[11px] font-mono uppercase font-bold text-error hover:underline shrink-0"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* 2-Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
              {/* Left Column: Upload Blocks (col-span-8) */}
              <div className="lg:col-span-8 flex flex-col gap-5">
                {/* Required Documents Section */}
                <div>
                  <div className="font-mono text-[11px] font-bold text-on-background uppercase tracking-widest mb-2.5 inline-block bg-primary-fixed px-2 py-0.5 border border-on-background">
                    REQUIRED
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
                    {/* Identity Document (Passport) */}
                    <UploadZone
                      label="Identity Document"
                      subtitle="Upload Front & Back"
                      required={true}
                      iconName="add_photo_alternate"
                      badgeIcon="upload_file"
                      hint="JPG, PNG, WebP (Max 10MB)"
                      file={files.passport}
                      previewUrl={previews.passport}
                      onChange={handleFileChange("passport")}
                      variant="card"
                    />

                    {/* Person Photo */}
                    <UploadZone
                      label="Person Photo"
                      subtitle="Live Selfie or Face Shot"
                      required={true}
                      iconName="camera_alt"
                      badgeIcon="face"
                      hint="JPG, PNG, WebP (Max 10MB)"
                      file={files.personPhoto}
                      previewUrl={previews.personPhoto}
                      onChange={handleFileChange("personPhoto")}
                      variant="card"
                    />
                  </div>
                </div>

                {/* Optional Documents Section */}
                <div>
                  <div className="font-mono text-[11px] font-bold text-on-surface-variant uppercase tracking-widest mb-2.5 inline-block bg-surface-container-high px-2 py-0.5 border border-outline-variant">
                    OPTIONAL
                  </div>

                  <UploadZone
                    label="Visa Document"
                    subtitle="For non-citizens or special travel status"
                    required={false}
                    hint="JPG, PNG, WebP (Max 10MB)"
                    file={files.visa}
                    previewUrl={previews.visa}
                    onChange={handleFileChange("visa")}
                    variant="visa"
                  />
                </div>
              </div>

              {/* Right Column: Parameters & Trigger (col-span-4) */}
              <div className="lg:col-span-4 flex flex-col gap-5">
                {/* Analysis Parameters Box */}
                <div className="border-2 border-on-background bg-surface-container p-4 md:p-5 shadow-[4px_4px_0px_0px_rgba(27,27,32,1)]">
                  <h3 className="text-base md:text-lg font-bold text-on-background mb-3 uppercase border-b-2 border-on-background pb-1.5 font-display">
                    Analysis Parameters
                  </h3>
                  <div className="flex flex-col gap-2.5 mt-3">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked
                        readOnly
                        className="w-4 h-4 border-2 border-on-background text-primary accent-primary rounded-none bg-white cursor-pointer"
                      />
                      <span className="font-mono text-xs text-on-background font-medium">
                        Enable OCR Extraction
                      </span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked
                        readOnly
                        className="w-4 h-4 border-2 border-on-background text-primary accent-primary rounded-none bg-white cursor-pointer"
                      />
                      <span className="font-mono text-xs text-on-background font-medium">
                        Biometric Face Match
                      </span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked
                        readOnly
                        className="w-4 h-4 border-2 border-on-background text-primary accent-primary rounded-none bg-white cursor-pointer"
                      />
                      <span className="font-mono text-xs text-on-background font-medium">
                        Tamper Detection (Advanced)
                      </span>
                    </label>
                  </div>

                  <div className="mt-4 pt-2.5 border-t border-outline-variant text-[10px] font-mono text-on-surface-variant leading-relaxed">
                    * Pipeline parameters active for this prototype screening session.
                  </div>
                </div>

                {/* Primary Analyze Button */}
                <button
                  id="analyze-btn"
                  onClick={handleAnalyze}
                  disabled={pageState === "loading"}
                  aria-busy={pageState === "loading"}
                  className={`
                    w-full bg-primary text-on-primary border-2 border-on-background
                    shadow-[6px_6px_0px_0px_rgba(27,27,32,1)] py-3 font-display text-lg uppercase tracking-wider
                    hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[4px_4px_0px_0px_rgba(27,27,32,1)]
                    active:translate-x-[6px] active:translate-y-[6px] active:shadow-none
                    transition-all duration-100 flex items-center justify-center gap-2.5 font-bold
                    ${pageState === "loading" ? "opacity-75 cursor-wait" : "cursor-pointer"}
                  `}
                >
                  {pageState === "loading" ? (
                    <>
                      <svg className="w-4 h-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                      </svg>
                      <span className="text-base">Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-xl">document_scanner</span>
                      <span>Analyze Document</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Process Indicator Strip */}
            <div className="mt-8 border-t-2 border-on-background pt-5 overflow-x-auto pb-2">
              <div className="flex items-center gap-1.5 font-mono text-[11px] whitespace-nowrap min-w-max text-on-surface-variant">
                <span className="bg-primary text-on-primary px-2.5 py-1 border-2 border-on-background shadow-[2px_2px_0px_0px_rgba(27,27,32,1)] font-bold uppercase">
                  1. Upload
                </span>
                <span className="material-symbols-outlined text-outline text-sm">arrow_forward</span>
                <span className="px-2.5 py-1 border-2 border-outline-variant bg-surface-container-low text-outline font-medium uppercase">
                  2. OCR
                </span>
                <span className="material-symbols-outlined text-outline text-sm">arrow_forward</span>
                <span className="px-2.5 py-1 border-2 border-outline-variant bg-surface-container-low text-outline font-medium uppercase">
                  3. Validation
                </span>
                <span className="material-symbols-outlined text-outline text-sm">arrow_forward</span>
                <span className="px-2.5 py-1 border-2 border-outline-variant bg-surface-container-low text-outline font-medium uppercase">
                  4. Tampering
                </span>
                <span className="material-symbols-outlined text-outline text-sm">arrow_forward</span>
                <span className="px-2.5 py-1 border-2 border-outline-variant bg-surface-container-low text-outline font-medium uppercase">
                  5. Face Match
                </span>
                <span className="material-symbols-outlined text-outline text-sm">arrow_forward</span>
                <span className="px-2.5 py-1 border-2 border-outline-variant bg-surface-container-low text-outline font-medium uppercase">
                  6. Risk
                </span>
                <span className="material-symbols-outlined text-outline text-sm">arrow_forward</span>
                <span className="px-2.5 py-1 border-2 border-outline-variant bg-surface-container-low text-outline font-medium uppercase">
                  7. Result
                </span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="w-full mt-auto border-t-2 border-on-background bg-surface-container">
        <div className="flex flex-col md:flex-row justify-between items-center w-full px-4 md:px-8 py-3.5 gap-3 max-w-6xl mx-auto font-mono text-[11px] text-on-surface-variant">
          <div>© 2026 Veritas Identity. Secured by structural integrity. Hackathon Prototype.</div>
          <div className="flex flex-wrap gap-4">
            <span className="hover:text-primary transition-colors cursor-pointer">Privacy Policy</span>
            <span className="hover:text-primary transition-colors cursor-pointer">Security Standards</span>
            <span className="hover:text-primary transition-colors cursor-pointer">Terms of Service</span>
            <span className="hover:text-primary transition-colors cursor-pointer">Compliance</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
