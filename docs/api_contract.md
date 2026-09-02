# API Contract

**AI Identity Document Screening System — Hackathon Prototype**

---

## Base URL

```
http://localhost:8000
```

---

## Endpoints

### `GET /api/health`

Liveness check.

**Response `200`**
```json
{ "status": "ok", "service": "AI Identity Document Screening System" }
```

---

### `POST /api/analyze`

**Content-Type:** `multipart/form-data`

**Request fields:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `passport` | File (image) | ✅ | Passport image (JPEG/PNG/WebP, max 10 MB) |
| `person_photo` | File (image) | ✅ | Live person photo (JPEG/PNG/WebP, max 10 MB) |
| `visa` | File (image) | ❌ | Visa image (optional) |

**Success Response `200`**

```json
{
  "document": {
    "type": "passport"
  },
  "extracted_data": {
    "name":            "JOHN DEMO DOE",
    "passport_number": "X12345678",
    "nationality":     "DEMO NATION",
    "dob":             "1990-06-15",
    "expiry":          "2028-06-14",
    "gender":          "M",
    "ocr_confidence":  0.94
  },
  "validation": {
    "status": "PASS",
    "issues": []
  },
  "tampering": {
    "score": 12.0,
    "status": "LOW",
    "issues": [],
    "suspicious_regions": []
  },
  "face_verification": {
    "similarity": 88.5,
    "match": true
  },
  "risk": {
    "score": 0.0,
    "level": "LOW",
    "reasons": ["No significant risk signals detected"]
  },
  "final_decision": "LOW RISK"
}
```

**Error Responses**

| Code | Reason |
|------|--------|
| `400` | Invalid file type |
| `413` | File exceeds 10 MB |
| `422` | Missing required field |
| `500` | Internal processing error |

**Error body:**
```json
{ "detail": "Human-readable error message" }
```

---

## Field Descriptions

### `extracted_data`

| Field | Type | Notes |
|-------|------|-------|
| `name` | string | Full name from document |
| `passport_number` | string | Alphanumeric passport number |
| `nationality` | string | Country name or code |
| `dob` | string | "YYYY-MM-DD" |
| `expiry` | string | "YYYY-MM-DD" |
| `gender` | string | "M" or "F" |
| `ocr_confidence` | float | 0.0–1.0 (1.0 = 100% confident) |

### `validation`

| Field | Values | Notes |
|-------|--------|-------|
| `status` | "PASS" / "WARNING" | Prototype consistency checks only |
| `issues` | string[] | Empty if PASS |

### `tampering`

| Field | Type | Notes |
|-------|------|-------|
| `score` | float (0–100) | Higher = more suspicious |
| `status` | "LOW" / "MEDIUM" / "HIGH" | Based on score ranges |
| `issues` | string[] | Description of detected anomalies |
| `suspicious_regions` | string[] | Region labels e.g. "photo_zone" |

### `face_verification`

| Field | Type | Notes |
|-------|------|-------|
| `similarity` | float (0–100) | Percentage similarity |
| `match` | bool | True if similarity ≥ threshold (~60%) |

### `risk`

| Field | Type | Notes |
|-------|------|-------|
| `score` | float (0–100) | Combined risk score, clamped |
| `level` | "LOW" / "MEDIUM" / "HIGH" | 0–30 LOW, 31–60 MEDIUM, 61–100 HIGH |
| `reasons` | string[] | Human-readable scoring reasons |

### `final_decision`

| Value | Meaning |
|-------|---------|
| `"LOW RISK"` | Risk level is LOW |
| `"MANUAL REVIEW RECOMMENDED"` | Risk level is MEDIUM or HIGH |

---

## Risk Scoring Weights (Prototype)

| Signal | Points |
|--------|--------|
| Face mismatch (similarity < 60%) | +50 |
| High tampering (score > 70) | +30 |
| Medium tampering (score 40–70) | +15 |
| Expired document | +25 |
| Per validation issue (max +30) | +15 each |
| Low OCR confidence (< 70%) | +10 |

Score is clamped to [0, 100].

---

*This API specification is for a hackathon prototype. Not for production use.*
