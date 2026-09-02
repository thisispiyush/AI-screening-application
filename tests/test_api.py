"""
tests/test_api.py
------------------
Integration tests for POST /api/analyze.
These tests call the real API endpoint (backend must be running).

Run with:
  cd backend
  pytest ../tests/test_api.py -v

Or run all tests:
  pytest ../tests/ -v
"""

import sys
from pathlib import Path
import pytest

sys.path.insert(0, str(Path(__file__).parent.parent / "backend"))


@pytest.fixture(scope="module")
def client():
    """Create a test client for the FastAPI app without needing a running server."""
    import os
    os.environ["AI_MOCK_MODE"] = "true"  # always use mock for tests

    from fastapi.testclient import TestClient
    from main import app
    return TestClient(app)


def _make_fake_image() -> bytes:
    """Return minimal valid JPEG bytes for testing (1x1 white pixel)."""
    # Minimal JPEG file bytes
    return (
        b'\xff\xd8\xff\xe0\x00\x10JFIF\x00\x01\x01\x00\x00\x01\x00\x01\x00\x00'
        b'\xff\xdb\x00C\x00\x08\x06\x06\x07\x06\x05\x08\x07\x07\x07\t\t'
        b'\x08\n\x0c\x14\r\x0c\x0b\x0b\x0c\x19\x12\x13\x0f\x14\x1d\x1a'
        b'\x1f\x1e\x1d\x1a\x1c\x1c $.\' ",#\x1c\x1c(7),01444\x1f\'9=82<.342\x1e'
        b'ef\xc0\x00\x0b\x08\x00\x01\x00\x01\x01\x01\x11\x00\xff\xc4\x00'
        b'\x1f\x00\x00\x01\x05\x01\x01\x01\x01\x01\x01\x00\x00\x00\x00\x00'
        b'\x00\x00\x00\x01\x02\x03\x04\x05\x06\x07\x08\t\n\x0b\xff\xc4\x00'
        b'S\x10\x00\x02\x01\x03\x03\x02\x04\x03\x05\x05\x04\x04\x00\x00'
        b'\x01}\x01\x02\x03\x00\x04\x11\x05\x12!1A\x06\x13Qa\x07"q\x142\x81'
        b'\x91\xa1\x08#B\xb1\xc1\x15R\xd1\xf0$3br\x82\t\n\x16\x17\x18\x19'
        b'\x1a%&\'()*456789:CDEFGHIJSTUVWXYZcdefghijstuvwxyz\x83\x84\x85\x86'
        b'\x87\x88\x89\x8a\x92\x93\x94\x95\x96\x97\x98\x99\x9a\xa2\xa3\xa4'
        b'\xa5\xa6\xa7\xa8\xa9\xaa\xb2\xb3\xb4\xb5\xb6\xb7\xb8\xb9\xba\xc2'
        b'\xc3\xc4\xc5\xc6\xc7\xc8\xc9\xca\xd2\xd3\xd4\xd5\xd6\xd7\xd8\xd9'
        b'\xda\xe1\xe2\xe3\xe4\xe5\xe6\xe7\xe8\xe9\xea\xf1\xf2\xf3\xf4\xf5'
        b'\xf6\xf7\xf8\xf9\xfa\xff\xda\x00\x08\x01\x01\x00\x00?\x00\xfb'
        b'\xd4P\x00\x00\x00\x1f\xff\xd9'
    )


# ─── Health check ─────────────────────────────────────────────────────────────

def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"


# ─── Successful analysis ──────────────────────────────────────────────────────

def test_analyze_with_mock_returns_200(client):
    img = _make_fake_image()
    response = client.post(
        "/api/analyze",
        files={
            "passport":     ("passport.jpg",     img, "image/jpeg"),
            "person_photo": ("person.jpg",        img, "image/jpeg"),
        },
    )
    assert response.status_code == 200
    data = response.json()

    # Check top-level keys match the contract
    assert "document" in data
    assert "extracted_data" in data
    assert "validation" in data
    assert "tampering" in data
    assert "face_verification" in data
    assert "risk" in data
    assert "final_decision" in data


def test_analyze_with_visa_returns_200(client):
    img = _make_fake_image()
    response = client.post(
        "/api/analyze",
        files={
            "passport":     ("passport.jpg", img, "image/jpeg"),
            "person_photo": ("person.jpg",   img, "image/jpeg"),
            "visa":         ("visa.jpg",     img, "image/jpeg"),
        },
    )
    assert response.status_code == 200


def test_response_has_correct_risk_fields(client):
    img = _make_fake_image()
    response = client.post(
        "/api/analyze",
        files={
            "passport":     ("p.jpg", img, "image/jpeg"),
            "person_photo": ("pp.jpg", img, "image/jpeg"),
        },
    )
    assert response.status_code == 200
    risk = response.json()["risk"]
    assert "score" in risk
    assert "level" in risk
    assert "reasons" in risk
    assert risk["level"] in ("LOW", "MEDIUM", "HIGH")
    assert 0 <= risk["score"] <= 100


def test_mock_final_decision_is_low_risk(client):
    """Mock data returns clean signals → should be LOW RISK."""
    img = _make_fake_image()
    response = client.post(
        "/api/analyze",
        files={
            "passport":     ("p.jpg", img, "image/jpeg"),
            "person_photo": ("pp.jpg", img, "image/jpeg"),
        },
    )
    assert response.status_code == 200
    assert response.json()["final_decision"] == "LOW RISK"


# ─── Error cases ──────────────────────────────────────────────────────────────

def test_missing_passport_returns_422(client):
    img = _make_fake_image()
    response = client.post(
        "/api/analyze",
        files={"person_photo": ("pp.jpg", img, "image/jpeg")},
    )
    assert response.status_code == 422


def test_missing_person_photo_returns_422(client):
    img = _make_fake_image()
    response = client.post(
        "/api/analyze",
        files={"passport": ("p.jpg", img, "image/jpeg")},
    )
    assert response.status_code == 422


def test_invalid_file_type_returns_400(client):
    response = client.post(
        "/api/analyze",
        files={
            "passport":     ("doc.pdf", b"%PDF-1.4 fake", "application/pdf"),
            "person_photo": ("pp.jpg", _make_fake_image(), "image/jpeg"),
        },
    )
    assert response.status_code == 400
