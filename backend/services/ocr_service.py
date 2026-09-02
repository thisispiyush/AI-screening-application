"""
backend/services/ocr_service.py
--------------------------------
OCR Service — extracts text fields from document images.

ARCHITECTURE PATTERN:
  OCRService is an adapter between the backend route and the actual AI module.
  
  When AI_MOCK_MODE=true  → uses _MockOCR (returns realistic demo data)
  When AI_MOCK_MODE=false → dynamically imports ai/ocr/ocr_module.py
                            (implemented by your teammate)

HOW TO SWITCH:
  Set AI_MOCK_MODE=false in backend/.env
  Make sure ai/ocr/ocr_module.py is implemented.
  Restart the backend. No other code changes needed.
"""

import os
import importlib
from typing import Optional


# ─── Mock Implementation ──────────────────────────────────────────────────────

class _MockOCR:
    """
    Returns deterministic demo data for hackathon development/testing.
    
    All values are clearly fictional. The name includes "DEMO" to prevent
    anyone from mistaking this for a real document result.
    """

    def extract(
        self, passport_bytes: bytes, visa_bytes: Optional[bytes]
    ) -> dict:
        """Return a plausible but clearly fake passport data dict."""
        return {
            "name":            "JOHN DEMO DOE",
            "passport_number": "X12345678",
            "nationality":     "DEMO NATION",
            "dob":             "1990-06-15",
            "expiry":          "2028-06-14",
            "gender":          "M",
            "confidence":      0.94,  # 94% confidence (mock)
        }


# ─── Real Implementation Loader ───────────────────────────────────────────────

class _RealOCR:
    """
    Delegates to ai/ocr/ocr_module.py implemented by your teammate.
    The module must expose an `extract(passport_bytes, visa_bytes)` function.
    """

    def __init__(self):
        try:
            # sys.path must include the project root for this import to work.
            # main.py adds the project root to sys.path at startup.
            self._module = importlib.import_module("ai.ocr.ocr_module")
        except ImportError as e:
            raise RuntimeError(
                "AI_MOCK_MODE=false but ai/ocr/ocr_module.py could not be "
                f"imported. Did your teammate create the file? Error: {e}"
            )

    def extract(
        self, passport_bytes: bytes, visa_bytes: Optional[bytes]
    ) -> dict:
        return self._module.extract(passport_bytes, visa_bytes)


# ─── Public Service ───────────────────────────────────────────────────────────

class OCRService:
    """
    Public adapter used by the API route.

    Usage:
        from services.ocr_service import OCRService
        ocr = OCRService()
        result = ocr.extract(passport_bytes, visa_bytes)

    Result dict shape:
        {
            "name":            str,
            "passport_number": str,
            "nationality":     str,
            "dob":             str,   # "YYYY-MM-DD"
            "expiry":          str,   # "YYYY-MM-DD"
            "gender":          str,   # "M" or "F"
            "confidence":      float  # 0.0 – 1.0
        }
    """

    def __init__(self):
        mock_mode = os.getenv("AI_MOCK_MODE", "true").lower() == "true"
        self._impl = _MockOCR() if mock_mode else _RealOCR()

    def extract(
        self, passport_bytes: bytes, visa_bytes: Optional[bytes] = None
    ) -> dict:
        """Extract structured data from passport (and optional visa) images."""
        return self._impl.extract(passport_bytes, visa_bytes)
