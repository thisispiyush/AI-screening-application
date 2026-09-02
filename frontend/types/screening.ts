/**
 * frontend/types/screening.ts
 * ----------------------------
 * TypeScript interfaces that exactly mirror the backend JSON response.
 *
 * If you change the backend schemas/response.py, update this file too.
 * These types are used throughout the frontend — no "any" types needed.
 */

// ─── Enums ────────────────────────────────────────────────────────────────────

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export type ValidationStatus = "PASS" | "WARNING" | "FAIL";

// ─── Sub-types ────────────────────────────────────────────────────────────────

export interface DocumentInfo {
  type: string; // e.g. "passport"
}

export interface ExtractedData {
  name: string;
  passport_number: string;
  nationality: string;
  dob: string; // "YYYY-MM-DD"
  expiry: string; // "YYYY-MM-DD"
  gender: string; // "M" or "F"
  ocr_confidence: number; // 0.0 – 1.0
}

export interface ValidationResult {
  status: ValidationStatus;
  issues: string[];
}

export interface TamperingResult {
  score: number; // 0–100
  status: RiskLevel;
  issues: string[];
  suspicious_regions: string[];
}

export interface FaceVerificationResult {
  similarity: number; // 0–100 (percentage)
  match: boolean;
}

export interface RiskResult {
  score: number; // 0–100 (clamped)
  level: RiskLevel;
  reasons: string[];
}

// ─── Top-level response ───────────────────────────────────────────────────────

export interface ScreeningResponse {
  document: DocumentInfo;
  extracted_data: ExtractedData;
  validation: ValidationResult;
  tampering: TamperingResult;
  face_verification: FaceVerificationResult;
  risk: RiskResult;
  final_decision: string;
}

// ─── API error ────────────────────────────────────────────────────────────────

export interface ApiError {
  error: string;
  detail?: string;
}

// ─── UI state ─────────────────────────────────────────────────────────────────

export type UploadState = "idle" | "uploading" | "success" | "error";

export interface UploadFiles {
  passport: File | null;
  visa: File | null;
  personPhoto: File | null;
}
