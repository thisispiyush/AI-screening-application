"""
backend/api/routes.py
----------------------
POST /api/analyze — the main orchestration endpoint.

This is the "conductor" of the pipeline:
  1. Receive uploaded files (passport, visa, person_photo)
  2. Validate file types / sizes
  3. Read bytes
  4. Call OCR
  5. Call document validation
  6. Call tampering detection
  7. Call face verification
  8. Calculate risk score
  9. Build and return the final ScreeningResponse

The services handle all the AI logic — this route only orchestrates.
"""

import logging
from typing import Optional

from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse

from schemas.response import (
    ScreeningResponse,
    ErrorResponse,
    DocumentInfo,
    ExtractedData,
    TamperingResult,
    FaceVerificationResult,
    RiskLevel,
)
from services.ocr_service import OCRService
from services.tampering_service import TamperingService
from services.face_service import FaceService
from validation.document_validator import ValidationService
from risk.risk_engine import RiskEngine
from utils.file_utils import read_and_validate

logger = logging.getLogger(__name__)

router = APIRouter()

# ─── Service instances (created once, reused per-request) ─────────────────────
# In a production app you'd use dependency injection.
# For this prototype, module-level instances are fine.
_ocr       = OCRService()
_tampering = TamperingService()
_face      = FaceService()
_validator = ValidationService()
_risk      = RiskEngine()


# ─── Health check ─────────────────────────────────────────────────────────────

@router.get("/health", summary="Health check")
async def health():
    """Quick liveness check — useful during development."""
    return {"status": "ok", "service": "AI Identity Document Screening System"}


# ─── Main endpoint ────────────────────────────────────────────────────────────

@router.post(
    "/analyze",
    response_model=ScreeningResponse,
    summary="Analyze identity documents",
    description=(
        "Upload a passport image and a live person photo "
        "(visa is optional). Returns a structured AI-assisted screening result. "
        "This is a prototype for demonstration purposes only."
    ),
)
async def analyze(
    passport:     UploadFile = File(...,  description="Passport image (JPEG/PNG)"),
    person_photo: UploadFile = File(...,  description="Live person photo (JPEG/PNG)"),
    visa:         Optional[UploadFile] = File(None, description="Visa image (optional)"),
):
    """
    Full document screening pipeline.

    Raises HTTP 400 on bad file types.
    Raises HTTP 413 on file too large.
    Raises HTTP 422 on missing required fields (FastAPI default).
    Raises HTTP 500 on internal processing errors.
    """
    # ── 1. Read & validate uploaded files ─────────────────────────────────────
    try:
        passport_bytes     = await read_and_validate(passport,     "passport")
        person_bytes       = await read_and_validate(person_photo, "person_photo")
        visa_bytes: Optional[bytes] = None
        if visa and visa.filename:
            visa_bytes     = await read_and_validate(visa,         "visa")
    except HTTPException:
        raise  # Let FastAPI handle 400/413 with the detail message
    except Exception as exc:
        logger.exception("Unexpected error reading uploaded files")
        raise HTTPException(status_code=500, detail="Failed to read uploaded files") from exc

    # ── 2. OCR ────────────────────────────────────────────────────────────────
    try:
        ocr_data = _ocr.extract(passport_bytes, visa_bytes)
    except Exception as exc:
        logger.exception("OCR processing failed")
        raise HTTPException(
            status_code=500,
            detail="OCR processing failed. Please try a clearer image."
        ) from exc

    # ── 3. Document Validation ────────────────────────────────────────────────
    try:
        validation_result = _validator.validate(ocr_data)
    except Exception as exc:
        logger.exception("Document validation failed")
        raise HTTPException(status_code=500, detail="Document validation error") from exc

    # ── 4. Tampering Detection ────────────────────────────────────────────────
    try:
        tampering_data = _tampering.detect(passport_bytes, visa_bytes)
    except Exception as exc:
        logger.exception("Tampering detection failed")
        raise HTTPException(
            status_code=500,
            detail="Tampering analysis failed. Please try again."
        ) from exc

    # ── 5. Face Verification ──────────────────────────────────────────────────
    try:
        face_data = _face.verify(passport_bytes, person_bytes)
    except Exception as exc:
        logger.exception("Face verification failed")
        raise HTTPException(
            status_code=500,
            detail="Face verification failed. Ensure the person photo shows a clear face."
        ) from exc

    # ── 6. Risk Engine ────────────────────────────────────────────────────────
    try:
        risk_result = _risk.score(ocr_data, validation_result, tampering_data, face_data)
    except Exception as exc:
        logger.exception("Risk engine failed")
        raise HTTPException(status_code=500, detail="Risk scoring error") from exc

    # ── 7. Determine tampering status level ───────────────────────────────────
    t_score = tampering_data.get("score", 0.0)
    if t_score > 70:
        t_level = RiskLevel.HIGH
    elif t_score > 40:
        t_level = RiskLevel.MEDIUM
    else:
        t_level = RiskLevel.LOW

    # ── 8. Final decision ─────────────────────────────────────────────────────
    final_decision = (
        "LOW RISK"
        if risk_result.level == RiskLevel.LOW
        else "MANUAL REVIEW RECOMMENDED"
    )

    # ── 9. Build response ─────────────────────────────────────────────────────
    response = ScreeningResponse(
        document=DocumentInfo(type="passport"),
        extracted_data=ExtractedData(
            name=            ocr_data.get("name", ""),
            passport_number= ocr_data.get("passport_number", ""),
            nationality=     ocr_data.get("nationality", ""),
            dob=             ocr_data.get("dob", ""),
            expiry=          ocr_data.get("expiry", ""),
            gender=          ocr_data.get("gender", ""),
            ocr_confidence=  ocr_data.get("confidence", 0.0),
        ),
        validation=validation_result,
        tampering=TamperingResult(
            score=              t_score,
            status=             t_level,
            issues=             tampering_data.get("issues", []),
            suspicious_regions= tampering_data.get("suspicious_regions", []),
        ),
        face_verification=FaceVerificationResult(
            similarity= face_data.get("similarity", 0.0),
            match=      face_data.get("match", False),
        ),
        risk=risk_result,
        final_decision=final_decision,
    )

    return response
