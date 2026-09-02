"""
backend/services/tampering_service.py
--------------------------------------
Tampering Detection Service — analyses document images for signs of manipulation.

ARCHITECTURE PATTERN:
  Same adapter pattern as ocr_service.py.
  Mock → ai/tampering/tampering_module.py (your teammate's code)

HOW TO SWITCH:
  Set AI_MOCK_MODE=false in backend/.env
  Make sure ai/tampering/tampering_module.py is implemented.
  Restart the backend. No other code changes needed.
"""

import os
import importlib
from typing import Optional


# ─── Mock Implementation ──────────────────────────────────────────────────────

class _MockTampering:
    """
    Returns deterministic demo data for hackathon development.
    Simulates a clean document (low suspicion) so the demo flow looks good.
    You can adjust these values to test different risk scenarios.
    """

    def detect(
        self, passport_bytes: bytes, visa_bytes: Optional[bytes]
    ) -> dict:
        return {
            "score":              12.0,          # 0–100, low = clean
            "issues":             [],
            "suspicious_regions": [],
        }


# ─── Real Implementation Loader ───────────────────────────────────────────────

class _RealTampering:
    """Delegates to ai/tampering/tampering_module.py."""

    def __init__(self):
        try:
            self._module = importlib.import_module("ai.tampering.tampering_module")
        except ImportError as e:
            raise RuntimeError(
                "AI_MOCK_MODE=false but ai/tampering/tampering_module.py "
                f"could not be imported. Error: {e}"
            )

    def detect(
        self, passport_bytes: bytes, visa_bytes: Optional[bytes]
    ) -> dict:
        return self._module.detect(passport_bytes, visa_bytes)


# ─── Public Service ───────────────────────────────────────────────────────────

class TamperingService:
    """
    Public adapter used by the API route.

    Usage:
        from services.tampering_service import TamperingService
        tampering = TamperingService()
        result = tampering.detect(passport_bytes, visa_bytes)

    Result dict shape:
        {
            "score":              float,      # 0–100
            "issues":             list[str],
            "suspicious_regions": list[str]
        }
    """

    def __init__(self):
        mock_mode = os.getenv("AI_MOCK_MODE", "true").lower() == "true"
        self._impl = _MockTampering() if mock_mode else _RealTampering()

    def detect(
        self, passport_bytes: bytes, visa_bytes: Optional[bytes] = None
    ) -> dict:
        """Analyse document image(s) for signs of tampering."""
        return self._impl.detect(passport_bytes, visa_bytes)
