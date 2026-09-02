"""
backend/schemas/response.py
---------------------------
Pydantic models that define the exact JSON structure returned by POST /api/analyze.

These models are the "contract" shared by the backend and frontend.
If you change a field here, update frontend/types/screening.ts to match.
"""

from pydantic import BaseModel
from typing import List, Optional
from enum import Enum


# ─── Enums ────────────────────────────────────────────────────────────────────

class RiskLevel(str, Enum):
    LOW    = "LOW"
    MEDIUM = "MEDIUM"
    HIGH   = "HIGH"


class ValidationStatus(str, Enum):
    PASS    = "PASS"
    WARNING = "WARNING"
    FAIL    = "FAIL"


# ─── Sub-models ───────────────────────────────────────────────────────────────

class DocumentInfo(BaseModel):
    type: str  # e.g. "passport"


class ExtractedData(BaseModel):
    """Fields extracted by the OCR module."""
    name:            str
    passport_number: str
    nationality:     str
    dob:             str   # "YYYY-MM-DD"
    expiry:          str   # "YYYY-MM-DD"
    gender:          str   # "M" or "F"
    ocr_confidence:  float  # 0.0 – 1.0 (internal, shown as % in UI)


class ValidationResult(BaseModel):
    """
    Prototype consistency checks only.
    NOT official government document validation rules.
    """
    status: ValidationStatus
    issues: List[str]


class TamperingResult(BaseModel):
    """
    AI-assisted tampering suspicion score.
    This is a prototype estimate, not a forensic conclusion.
    """
    score:              float        # 0–100
    status:             RiskLevel    # LOW / MEDIUM / HIGH
    issues:             List[str]
    suspicious_regions: List[str]


class FaceVerificationResult(BaseModel):
    """
    AI-assisted face comparison between passport photo and live photo.
    This is a prototype estimate, not a biometric identity verification.
    """
    similarity: float  # 0–100 (percentage)
    match:      bool


class RiskResult(BaseModel):
    """
    Transparent prototype risk score combining all signals.
    Not a scientifically validated risk model.
    """
    score:   float      # 0–100 (clamped)
    level:   RiskLevel  # LOW / MEDIUM / HIGH
    reasons: List[str]  # Human-readable explanations


# ─── Top-level response ───────────────────────────────────────────────────────

class ScreeningResponse(BaseModel):
    document:          DocumentInfo
    extracted_data:    ExtractedData
    validation:        ValidationResult
    tampering:         TamperingResult
    face_verification: FaceVerificationResult
    risk:              RiskResult
    final_decision:    str  # "LOW RISK" or "MANUAL REVIEW RECOMMENDED"


class ErrorResponse(BaseModel):
    error:   str
    detail:  Optional[str] = None
