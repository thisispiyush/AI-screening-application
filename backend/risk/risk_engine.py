"""
backend/risk/risk_engine.py
----------------------------
Transparent prototype risk scoring engine.

⚠️  IMPORTANT DISCLAIMER:
    This is a prototype scoring mechanism for a hackathon demo.
    It is NOT a scientifically validated or production-ready risk model.
    It should NOT be used to make real decisions about real people or documents.

HOW IT WORKS:
    The engine adds penalty points for each suspicious signal, then clamps
    the total to [0, 100] and maps it to a risk level.

SCORING TABLE:
    Face mismatch (similarity < 60%)         → +50 points
    High tampering (score > 70)              → +30 points
    Medium tampering (score 40–70)           → +15 points
    Expired document                         → +25 points
    Each validation issue                    → +15 points (max +30)
    Low OCR confidence (< 0.70)              → +10 points

RISK LEVELS:
    0  – 30  → LOW    → "LOW RISK"
    31 – 60  → MEDIUM → "MANUAL REVIEW RECOMMENDED"
    61 – 100 → HIGH   → "MANUAL REVIEW RECOMMENDED"

HOW TO ADJUST:
    Change the WEIGHTS dict and THRESHOLDS below.
    Everything is in one place and clearly labelled.
"""

from schemas.response import RiskResult, RiskLevel
from typing import List


# ─── Configuration ─────────────────────────────────────────────────────────────
# Adjust these values to tune the scoring without touching logic.

WEIGHTS = {
    "face_mismatch":         50,
    "high_tampering":        30,
    "medium_tampering":      15,
    "expired_document":      25,
    "per_validation_issue":  15,
    "max_validation_penalty": 30,   # cap so many small issues don't dominate
    "low_ocr_confidence":    10,
}

THRESHOLDS = {
    "face_similarity_mismatch": 60.0,   # below this → face mismatch
    "tampering_high":           70.0,   # above this → high tampering
    "tampering_medium":         40.0,   # above this (and ≤ high) → medium
    "ocr_confidence_low":        0.70,  # below this → low confidence
}

RISK_BOUNDARIES = {
    "low_max":    30,
    "medium_max": 60,
}

EXPIRED_KEYWORD = "expired"  # matches ValidationService expiry warning text


# ─── Engine ────────────────────────────────────────────────────────────────────

class RiskEngine:
    """
    Combines signals from OCR, validation, tampering, and face verification
    into a single transparent risk score.

    Usage:
        engine = RiskEngine()
        result = engine.score(ocr_result, validation_result, tampering_result, face_result)
    """

    def score(
        self,
        ocr_result:        dict,
        validation_result,         # ValidationResult Pydantic model
        tampering_result:  dict,
        face_result:       dict,
    ) -> RiskResult:
        """
        Calculate the risk score.

        Args:
            ocr_result:        Output of OCRService.extract()
            validation_result: Output of ValidationService.validate()
            tampering_result:  Output of TamperingService.detect()
            face_result:       Output of FaceService.verify()

        Returns:
            RiskResult with score (0–100), level (LOW/MEDIUM/HIGH), and reasons.
        """
        points: float = 0.0
        reasons: List[str] = []

        # ── Face Verification ─────────────────────────────────────────────────
        face_similarity = face_result.get("similarity", 100.0)
        face_match = face_result.get("match", True)

        if not face_match or face_similarity < THRESHOLDS["face_similarity_mismatch"]:
            points += WEIGHTS["face_mismatch"]
            reasons.append(
                f"Face verification failed — similarity {face_similarity:.1f}% "
                f"(threshold: {THRESHOLDS['face_similarity_mismatch']:.0f}%)"
            )

        # ── Tampering ─────────────────────────────────────────────────────────
        tampering_score = tampering_result.get("score", 0.0)

        if tampering_score > THRESHOLDS["tampering_high"]:
            points += WEIGHTS["high_tampering"]
            reasons.append(
                f"High document tampering suspicion detected "
                f"(score: {tampering_score:.1f}/100)"
            )
        elif tampering_score > THRESHOLDS["tampering_medium"]:
            points += WEIGHTS["medium_tampering"]
            reasons.append(
                f"Moderate document tampering suspicion detected "
                f"(score: {tampering_score:.1f}/100)"
            )

        for region in tampering_result.get("suspicious_regions", []):
            reasons.append(f"Suspicious region flagged: {region}")

        # ── Validation Issues ─────────────────────────────────────────────────
        validation_issues = getattr(validation_result, "issues", [])

        # Expired document gets its own dedicated penalty (more severe)
        expired_issues = [
            i for i in validation_issues
            if EXPIRED_KEYWORD in i.lower()
        ]
        other_issues = [
            i for i in validation_issues
            if EXPIRED_KEYWORD not in i.lower()
        ]

        if expired_issues:
            points += WEIGHTS["expired_document"]
            reasons.append("Document appears to be expired")

        # Cap general validation penalties
        other_penalty = min(
            len(other_issues) * WEIGHTS["per_validation_issue"],
            WEIGHTS["max_validation_penalty"],
        )
        if other_penalty > 0:
            points += other_penalty
            reasons.append(
                f"{len(other_issues)} validation issue(s) detected "
                f"(e.g. missing fields, format errors)"
            )

        # ── OCR Confidence ────────────────────────────────────────────────────
        ocr_confidence = ocr_result.get("confidence", 1.0)

        if ocr_confidence < THRESHOLDS["ocr_confidence_low"]:
            points += WEIGHTS["low_ocr_confidence"]
            reasons.append(
                f"Low OCR confidence ({ocr_confidence * 100:.1f}%) — "
                f"extracted data may be inaccurate"
            )

        # ── Final Score ───────────────────────────────────────────────────────
        final_score = max(0.0, min(100.0, points))  # clamp [0, 100]
        level = self._level(final_score)

        # No reasons → document looks clean
        if not reasons:
            reasons = ["No significant risk signals detected"]

        return RiskResult(
            score=round(final_score, 1),
            level=level,
            reasons=reasons,
        )

    @staticmethod
    def _level(score: float) -> RiskLevel:
        if score <= RISK_BOUNDARIES["low_max"]:
            return RiskLevel.LOW
        elif score <= RISK_BOUNDARIES["medium_max"]:
            return RiskLevel.MEDIUM
        else:
            return RiskLevel.HIGH
