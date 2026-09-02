"""
tests/test_risk_engine.py
--------------------------
Unit tests for the risk engine.

Run with:
  cd backend
  pytest ../tests/test_risk_engine.py -v
"""

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from risk.risk_engine import RiskEngine
from validation.document_validator import ValidationService
from schemas.response import RiskLevel, ValidationStatus

engine    = RiskEngine()
validator = ValidationService()


def _make_validation(issues=None):
    """Helper: create a ValidationResult with given issues."""
    from schemas.response import ValidationResult
    if issues is None:
        issues = []
    status = ValidationStatus.PASS if not issues else ValidationStatus.WARNING
    return ValidationResult(status=status, issues=issues)


def _ocr(confidence=0.94):
    return {"confidence": confidence}

def _tampering(score=10.0):
    return {"score": score, "issues": [], "suspicious_regions": []}

def _face(similarity=88.5, match=True):
    return {"similarity": similarity, "match": match}


# ─── LOW risk ─────────────────────────────────────────────────────────────────

def test_clean_document_is_low_risk():
    result = engine.score(
        _ocr(), _make_validation(), _tampering(), _face()
    )
    assert result.level == RiskLevel.LOW
    assert result.score <= 30


# ─── Face mismatch ────────────────────────────────────────────────────────────

def test_face_mismatch_adds_50_points():
    result = engine.score(
        _ocr(), _make_validation(), _tampering(), _face(similarity=30.0, match=False)
    )
    assert result.score >= 50
    assert any("face" in r.lower() for r in result.reasons)


def test_face_mismatch_makes_high_risk():
    result = engine.score(
        _ocr(), _make_validation(), _tampering(), _face(similarity=10.0, match=False)
    )
    assert result.level in (RiskLevel.MEDIUM, RiskLevel.HIGH)


# ─── Tampering ────────────────────────────────────────────────────────────────

def test_high_tampering_adds_30_points():
    result_clean  = engine.score(_ocr(), _make_validation(), _tampering(10),  _face())
    result_tamper = engine.score(_ocr(), _make_validation(), _tampering(80),  _face())
    assert result_tamper.score >= result_clean.score + 30


def test_medium_tampering_adds_15_points():
    result_clean  = engine.score(_ocr(), _make_validation(), _tampering(10), _face())
    result_medium = engine.score(_ocr(), _make_validation(), _tampering(55), _face())
    assert result_medium.score >= result_clean.score + 15


# ─── Validation issues ────────────────────────────────────────────────────────

def test_expired_document_adds_25_points():
    result_clean   = engine.score(_ocr(), _make_validation(), _tampering(), _face())
    result_expired = engine.score(
        _ocr(),
        _make_validation(["Document appears to have expired on 01 Jan 2020."]),
        _tampering(),
        _face(),
    )
    assert result_expired.score >= result_clean.score + 25


def test_validation_issues_capped_at_max():
    many_issues = [f"Issue {i}" for i in range(10)]
    result = engine.score(_ocr(), _make_validation(many_issues), _tampering(), _face())
    # Validation penalty is capped at 30 points
    assert result.score <= 30 + 5  # small buffer for rounding


# ─── OCR confidence ───────────────────────────────────────────────────────────

def test_low_ocr_confidence_adds_10_points():
    result_high_conf = engine.score(_ocr(0.95), _make_validation(), _tampering(), _face())
    result_low_conf  = engine.score(_ocr(0.50), _make_validation(), _tampering(), _face())
    assert result_low_conf.score >= result_high_conf.score + 10


# ─── Score clamping ───────────────────────────────────────────────────────────

def test_score_never_exceeds_100():
    result = engine.score(
        _ocr(0.30),
        _make_validation([f"Issue {i}" for i in range(20)]),
        _tampering(95.0),
        _face(5.0, False),
    )
    assert result.score <= 100.0


def test_score_never_below_0():
    result = engine.score(_ocr(1.0), _make_validation(), _tampering(0.0), _face(100.0, True))
    assert result.score >= 0.0


# ─── Risk levels ─────────────────────────────────────────────────────────────

def test_risk_levels_are_correct():
    from risk.risk_engine import RiskEngine, RISK_BOUNDARIES, RiskLevel
    assert RiskEngine._level(0)   == RiskLevel.LOW
    assert RiskEngine._level(30)  == RiskLevel.LOW
    assert RiskEngine._level(31)  == RiskLevel.MEDIUM
    assert RiskEngine._level(60)  == RiskLevel.MEDIUM
    assert RiskEngine._level(61)  == RiskLevel.HIGH
    assert RiskEngine._level(100) == RiskLevel.HIGH
