"""
tests/test_validation.py
------------------------
Unit tests for the document validation service.

Run with:
  cd backend
  pytest ../tests/test_validation.py -v
"""

import sys
from pathlib import Path

# Add backend to path so imports work
sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))

from validation.document_validator import ValidationService
from schemas.response import ValidationStatus


validator = ValidationService()


def _base_data(**overrides) -> dict:
    """Return a clean, valid data dict with optional field overrides."""
    data = {
        "name":            "John Demo Doe",
        "passport_number": "X12345678",
        "nationality":     "Demo Nation",
        "dob":             "1990-06-15",
        "expiry":          "2030-01-01",
        "gender":          "M",
        "confidence":      0.94,
    }
    data.update(overrides)
    return data


# ─── PASS cases ───────────────────────────────────────────────────────────────

def test_valid_document_passes():
    result = validator.validate(_base_data())
    assert result.status == ValidationStatus.PASS
    assert result.issues == []


def test_female_gender_passes():
    result = validator.validate(_base_data(gender="F"))
    assert result.status == ValidationStatus.PASS


# ─── Field presence ───────────────────────────────────────────────────────────

def test_empty_name_warns():
    result = validator.validate(_base_data(name=""))
    assert result.status == ValidationStatus.WARNING
    assert any("name" in i for i in result.issues)


def test_empty_passport_number_warns():
    result = validator.validate(_base_data(passport_number=""))
    assert result.status == ValidationStatus.WARNING


def test_empty_nationality_warns():
    result = validator.validate(_base_data(nationality=""))
    assert result.status == ValidationStatus.WARNING


# ─── Dates ────────────────────────────────────────────────────────────────────

def test_expired_document_warns():
    result = validator.validate(_base_data(expiry="2020-01-01"))
    assert result.status == ValidationStatus.WARNING
    assert any("expired" in i.lower() for i in result.issues)


def test_invalid_dob_format_warns():
    result = validator.validate(_base_data(dob="15-06-1990"))  # wrong format
    assert result.status == ValidationStatus.WARNING


def test_future_dob_warns():
    result = validator.validate(_base_data(dob="2099-01-01"))
    assert result.status == ValidationStatus.WARNING


def test_invalid_expiry_format_warns():
    result = validator.validate(_base_data(expiry="Jan 2030"))
    assert result.status == ValidationStatus.WARNING


# ─── Passport number format ───────────────────────────────────────────────────

def test_numeric_only_passport_warns():
    # No leading letters — unusual but caught
    result = validator.validate(_base_data(passport_number="123456789"))
    # This should warn because our pattern requires at least 1 letter
    assert result.status == ValidationStatus.WARNING


def test_valid_passport_format_passes():
    result = validator.validate(_base_data(passport_number="AB1234567"))
    assert result.status == ValidationStatus.PASS


# ─── Gender ───────────────────────────────────────────────────────────────────

def test_unknown_gender_warns():
    result = validator.validate(_base_data(gender="X"))
    assert result.status == ValidationStatus.WARNING


def test_lowercase_gender_passes():
    # Service should upper-case before checking
    result = validator.validate(_base_data(gender="m"))
    assert result.status == ValidationStatus.PASS
