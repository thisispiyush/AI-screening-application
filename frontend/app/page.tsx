/**
 * frontend/app/page.tsx
 * ----------------------
 * Landing page — shows the upload form and, after analysis, the result dashboard.
 *
 * State machine:
 *   "idle"      → upload form is visible, ready for input
 *   "loading"   → form submitted, waiting for API response
 *   "result"    → API responded successfully, show ResultDashboard
 *   "error"     → API or network error, show error message
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
    passport:    null,
    visa:        null,
    personPhoto: null,
  });

  // Preview object URLs (generated client-side for display)
  const [previews, setPreviews] = useState<{
    passport:    string | null;
    visa:        string | null;
    personPhoto: string | null;
  }>({ passport: null, visa: null, personPhoto: null });

  // ── UI state ─────────────────────────────────────────────────────────────────
  const [pageState,  setPageState]  = useState<PageState>("idle");
  const [result,     setResult]     = useState<ScreeningResponse | null>(null);
  const [errorMsg,   setErrorMsg]   = useState<string>("");

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
      setErrorMsg("Please upload a passport image.");
      setPageState("error");
      return;
    }
    if (!files.personPhoto) {
      setErrorMsg("Please upload a person/live photo.");
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
      // Scroll to top to show results
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
    <main className="min-h-screen px-4 py-10 flex flex-col items-center">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="w-full max-w-4xl mb-10 text-center">
        {/* Logo mark */}
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 shadow-[0_0_40px_rgba(124,58,237,0.4)] mb-5">
          <span className="text-2xl">🛡️</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white mb-3">
          AI Identity Document{" "}
          <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            Screening
          </span>
        </h1>
        <p className="text-slate-400 max-w-xl mx-auto text-sm leading-relaxed">
          Upload an identity document and live photo for AI-assisted screening.
          This is a <span className="text-violet-400 font-medium">hackathon prototype</span> — not an official government verification system.
        </p>

        {/* Tag row */}
        <div className="flex flex-wrap justify-center gap-2 mt-4">
          {["OCR", "Tampering Detection", "Face Verification", "Risk Scoring"].map((tag) => (
            <span key={tag} className="text-xs bg-white/5 border border-white/10 text-slate-400 px-3 py-1 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      </header>

      {/* ── Result or Upload Form ────────────────────────────────────────────── */}
      {pageState === "result" && result ? (
        <div className="w-full animate-fade-in-up">
          {/* Back button */}
          <div className="max-w-4xl mx-auto mb-6 flex items-center gap-4">
            <button
              id="analyze-new-btn"
              onClick={handleReset}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              ← Analyze a new document
            </button>
          </div>
          <ResultDashboard
            result={result}
            passportPreview={previews.passport}
            personPreview={previews.personPhoto}
          />
        </div>
      ) : (
        /* ── Upload Form ──────────────────────────────────────────────────── */
        <div className="w-full max-w-3xl">
          <div className="relative rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-[0_8px_64px_rgba(0,0,0,0.6)] p-8">
            {/* Top accent */}
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />

            <h2 className="text-lg font-semibold text-white mb-6">
              Upload Documents
            </h2>

            {/* Three upload zones */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <UploadZone
                label="Passport"
                required
                icon="📗"
                hint="Front page of passport — JPEG, PNG, WebP"
                file={files.passport}
                previewUrl={previews.passport}
                onChange={handleFileChange("passport")}
              />
              <UploadZone
                label="Person Photo"
                required
                icon="🤳"
                hint="Live photo or clear face shot"
                file={files.personPhoto}
                previewUrl={previews.personPhoto}
                onChange={handleFileChange("personPhoto")}
              />
            </div>

            <div className="mb-8">
              <UploadZone
                label="Visa (Optional)"
                icon="🗂️"
                hint="Visa page — optional"
                file={files.visa}
                previewUrl={previews.visa}
                onChange={handleFileChange("visa")}
              />
            </div>

            {/* Error message */}
            {pageState === "error" && errorMsg && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/30 px-4 py-3"
              >
                <span className="text-xl shrink-0">⛔</span>
                <div>
                  <p className="text-sm font-medium text-red-300">
                    Error
                  </p>
                  <p className="text-sm text-red-200/70 mt-0.5">
                    {errorMsg}
                  </p>
                </div>
              </div>
            )}

            {/* Analyze button */}
            <button
              id="analyze-btn"
              onClick={handleAnalyze}
              disabled={pageState === "loading"}
              aria-busy={pageState === "loading"}
              className={`
                w-full py-3.5 px-6 rounded-xl font-semibold text-white
                flex items-center justify-center gap-3
                transition-all duration-200
                ${pageState === "loading"
                  ? "bg-violet-700/60 cursor-not-allowed opacity-70"
                  : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 hover:shadow-[0_0_32px_rgba(124,58,237,0.5)] active:scale-[0.98]"
                }
              `}
            >
              {pageState === "loading" ? (
                <>
                  {/* Spinner */}
                  <svg
                    className="w-5 h-5 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12" cy="12" r="10"
                      stroke="currentColor" strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z"
                    />
                  </svg>
                  Analyzing document…
                </>
              ) : (
                <>
                  🔍 Analyze Document
                </>
              )}
            </button>

            {/* Flow indicator */}
            <div className="mt-6 flex items-center justify-center gap-2 flex-wrap">
              {["Upload", "OCR", "Validate", "Tampering", "Face", "Risk", "Result"].map(
                (step, i, arr) => (
                  <div key={step} className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-600 font-medium">{step}</span>
                    {i < arr.length - 1 && (
                      <span className="text-slate-700">→</span>
                    )}
                  </div>
                )
              )}
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-center text-xs text-slate-600 mt-5">
            Demo uses synthetic/fictional data only. Do not upload real government documents.
          </p>
        </div>
      )}
    </main>
  );
}
