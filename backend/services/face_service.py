"""
backend/services/face_service.py
---------------------------------
Face Verification Service — compares the face on the passport with a live photo.

ARCHITECTURE PATTERN:
  Same adapter pattern as ocr_service.py.
  Mock → ai/face/face_module.py (your teammate's code)

HOW TO SWITCH:
  Set AI_MOCK_MODE=false in backend/.env
  Make sure ai/face/face_module.py is implemented.
  Restart the backend. No other code changes needed.
"""

import os
import importlib


# ─── Mock Implementation ──────────────────────────────────────────────────────

class _MockFace:
    """
    Returns deterministic demo data for hackathon development.
    Simulates a strong face match so the demo flow shows a clean result.
    """

    def verify(self, passport_bytes: bytes, person_bytes: bytes) -> dict:
        return {
            "similarity": 88.5,   # High similarity — good match
            "match":      True,
        }


# ─── Real Implementation Loader ───────────────────────────────────────────────

class _RealFace:
    """Delegates to ai/face/face_module.py."""

    def __init__(self):
        try:
            self._module = importlib.import_module("ai.face.face_module")
        except ImportError as e:
            raise RuntimeError(
                "AI_MOCK_MODE=false but ai/face/face_module.py "
                f"could not be imported. Error: {e}"
            )

    def verify(self, passport_bytes: bytes, person_bytes: bytes) -> dict:
        return self._module.verify(passport_bytes, person_bytes)


# ─── Public Service ───────────────────────────────────────────────────────────

class FaceService:
    """
    Public adapter used by the API route.

    Usage:
        from services.face_service import FaceService
        face = FaceService()
        result = face.verify(passport_bytes, person_bytes)

    Result dict shape:
        {
            "similarity": float,  # 0–100 (percentage)
            "match":      bool
        }
    """

    def __init__(self):
        mock_mode = os.getenv("AI_MOCK_MODE", "true").lower() == "true"
        self._impl = _MockFace() if mock_mode else _RealFace()

    def verify(self, passport_bytes: bytes, person_bytes: bytes) -> dict:
        """Compare passport face with live person photo."""
        return self._impl.verify(passport_bytes, person_bytes)
