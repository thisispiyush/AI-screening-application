"""
backend/validation/document_validator.py
-----------------------------------------
Prototype consistency checks for extracted document data.

⚠️  IMPORTANT DISCLAIMER:
    These checks are basic prototype consistency rules for a hackathon demo.
    They are NOT official government document validation rules.
    They check logical consistency of extracted data only.

Checks performed:
  1.  Required fields are non-empty.
  2.  Passport number is non-empty and matches a basic alphanumeric pattern.
  3.  Date of birth is a valid date in YYYY-MM-DD format.
  4.  Expiry date is a valid date in YYYY-MM-DD format.
  5.  Document is not expired (expiry > today).
  6.  Person is at least 1 year old (sanity check).
  7.  Nationality field is non-empty.
  8.  Gender is "M" or "F".
"""

import re
from datetime import date, datetime
from typing import Tuple, List

from schemas.response import ValidationResult, ValidationStatus


# ─── Constants ────────────────────────────────────────────────────────────────

# Basic pattern: 1–3 letters optionally followed by 5–9 digits
# Real passport numbers vary by country — this is a prototype check only.
PASSPORT_NUMBER_PATTERN = re.compile(r"^[A-Z]{1,3}[0-9]{5,9}$", re.IGNORECASE)

DATE_FORMAT = "%Y-%m-%d"


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _parse_date(value: str, field_label: str) -> Tuple[date | None, str | None]:
    """
    Try to parse a date string in YYYY-MM-DD format.

    Returns (date_obj, None) on success or (None, error_message) on failure.
    """
    if not value or not value.strip():
        return None, f"{field_label} is missing"
    try:
        return datetime.strptime(value.strip(), DATE_FORMAT).date(), None
    except ValueError:
        return None, (
            f"{field_label} has an unrecognised format: '{value}'. "
            f"Expected YYYY-MM-DD."
        )


# ─── Main Validator ───────────────────────────────────────────────────────────

class ValidationService:
    """
    Runs prototype consistency checks on OCR-extracted document data.

    Usage:
        validator = ValidationService()
        result = validator.validate(extracted_data_dict)
    """

    def validate(self, data: dict) -> ValidationResult:
        """
        Args:
            data: Dictionary from OCRService.extract()

        Returns:
            ValidationResult with status PASS or WARNING and a list of issues.
        """
        issues: List[str] = []

        # ── 1. Required text fields ───────────────────────────────────────────
        for field in ("name", "passport_number", "nationality"):
            if not data.get(field, "").strip():
                issues.append(f"Required field is missing or empty: '{field}'")

        # ── 2. Passport number format ─────────────────────────────────────────
        passport_num = data.get("passport_number", "").strip()
        if passport_num and not PASSPORT_NUMBER_PATTERN.match(passport_num):
            issues.append(
                f"Passport number '{passport_num}' does not match the expected "
                f"alphanumeric format (prototype check only — formats vary by country)."
            )

        # ── 3. Date of birth ──────────────────────────────────────────────────
        dob, dob_err = _parse_date(data.get("dob", ""), "Date of birth")
        if dob_err:
            issues.append(dob_err)
        elif dob:
            today = date.today()
            age_years = (today - dob).days / 365.25
            if age_years < 1:
                issues.append(
                    "Date of birth implies an age of less than 1 year — "
                    "this may indicate an extraction error."
                )
            if dob > today:
                issues.append(
                    "Date of birth is in the future — likely an extraction error."
                )

        # ── 4 & 5. Expiry date ────────────────────────────────────────────────
        expiry, exp_err = _parse_date(data.get("expiry", ""), "Expiry date")
        if exp_err:
            issues.append(exp_err)
        elif expiry:
            if expiry < date.today():
                issues.append(
                    f"Document appears to have expired on {expiry.strftime('%d %b %Y')}."
                )

        # ── 6. Nationality ────────────────────────────────────────────────────
        if not data.get("nationality", "").strip():
            issues.append("Nationality field is missing.")

        # ── 7. Gender ─────────────────────────────────────────────────────────
        gender = data.get("gender", "").strip().upper()
        if gender and gender not in ("M", "F"):
            issues.append(
                f"Unrecognised gender value: '{gender}'. Expected 'M' or 'F'."
            )

        # ── Result ────────────────────────────────────────────────────────────
        status = ValidationStatus.PASS if not issues else ValidationStatus.WARNING
        return ValidationResult(status=status, issues=issues)
