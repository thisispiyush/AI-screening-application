# AI Identity Document Screening System

> **Hackathon Prototype** — HACK-A-THRONE 2026  
> Built by a team of 3 second-year CSE students.

---

## ⚠️ Disclaimer

This is an **AI-assisted hackathon prototype** built for demonstration purposes only.

- It **cannot** definitively determine whether a real government document is genuine.
- It is **not** a production-grade or government-certified verification system.
- Do **not** upload real government documents to this demo.
- All results should be treated as **prototype screening estimates only**.

---

## 1. Problem

Manually reviewing identity documents is:
- Time-consuming and error-prone
- Hard to scale at high volumes
- Inconsistent across reviewers

---

## 2. Solution

An AI-assisted document screening pipeline that automatically:

1. **Extracts** text data from passport images using OCR
2. **Validates** basic document consistency (dates, fields, formats)
3. **Detects** potential tampering or manipulation
4. **Verifies** that the passport face matches the live person photo
5. **Scores** the overall risk and produces a structured result

Designed to **assist** human reviewers — not replace them.

---

## 3. Architecture

```
Browser (Next.js :3000)
    │  multipart/form-data  POST /api/analyze
    ▼
FastAPI Backend (:8000)
    │
    ├─► OCRService.extract(passport, visa)
    │       └─ Text fields from document
    │
    ├─► ValidationService.validate(extracted_data)
    │       └─ Consistency checks
    │
    ├─► TamperingService.detect(passport, visa)
    │       └─ Tampering score 0–100
    │
    ├─► FaceService.verify(passport, person_photo)
    │       └─ Similarity % + match bool
    │
    └─► RiskEngine.score(all_signals)
            └─ Risk score 0–100 + level + reasons

    Final JSON ──► Next.js Dashboard
```

---

## 4. Technology Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Next.js 14, React, TypeScript, Tailwind CSS |
| **Backend** | Python 3.11, FastAPI, Uvicorn |
| **AI/ML** | Teammate modules: OCR, Tampering, Face verification |
| **Data** | No database — stateless per-request processing |

---

## 5. How the Frontend Works

Located in `frontend/`.

| File | Purpose |
|------|---------|
| `app/page.tsx` | Upload form + result dashboard in one page |
| `components/UploadZone.tsx` | Drag-and-drop image upload with preview |
| `components/ResultDashboard.tsx` | Full results display |
| `components/RiskBadge.tsx` | Colour-coded LOW/MEDIUM/HIGH badge |
| `components/StatusCard.tsx` | Reusable card container |
| `lib/api.ts` | Single API client — the only place fetch calls live |
| `types/screening.ts` | TypeScript interfaces for the full API response |

---

## 6. How the Backend Works

Located in `backend/`.

| File | Purpose |
|------|---------|
| `main.py` | FastAPI app, CORS, startup |
| `api/routes.py` | `POST /api/analyze` — orchestration |
| `services/ocr_service.py` | OCR adapter (mock or real) |
| `services/tampering_service.py` | Tampering adapter (mock or real) |
| `services/face_service.py` | Face verification adapter (mock or real) |
| `validation/document_validator.py` | Consistency checks |
| `risk/risk_engine.py` | Transparent scoring engine |
| `schemas/response.py` | Pydantic response models |
| `utils/file_utils.py` | File validation helpers |

---

## 7. AI Integration Points

Each AI module lives in the `ai/` directory and is loaded by a service adapter in `backend/services/`.

### OCR Module — `ai/ocr/ocr_module.py`
```python
def extract(passport_bytes: bytes, visa_bytes: bytes | None) -> dict:
    # Returns: name, passport_number, nationality, dob, expiry, gender, confidence
```

### Tampering Detection — `ai/tampering/tampering_module.py`
```python
def detect(passport_bytes: bytes, visa_bytes: bytes | None) -> dict:
    # Returns: score (0-100), issues, suspicious_regions
```

### Face Verification — `ai/face/face_module.py`
```python
def verify(passport_bytes: bytes, person_bytes: bytes) -> dict:
    # Returns: similarity (0-100), match (bool)
```

See each `ai/*/README.md` for detailed instructions.

---

## 8. API Endpoint

```
POST http://localhost:8000/api/analyze
Content-Type: multipart/form-data

Fields:
  passport      (required) — image file
  person_photo  (required) — image file
  visa          (optional) — image file
```

Full API documentation: [`docs/api_contract.md`](docs/api_contract.md)

Interactive Swagger UI when backend is running: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 9. Local Setup

### Prerequisites

- **Python 3.11+**
- **Node.js 18.17+**
- **npm**

### Backend Setup

```bash
cd backend

# Copy env file
copy .env.example .env        # Windows
# cp .env.example .env        # macOS/Linux

# Create virtual environment
python -m venv venv
venv\Scripts\activate         # Windows
# source venv/bin/activate    # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Run backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

Backend will be available at: http://localhost:8000  
Swagger UI: http://localhost:8000/docs

### Frontend Setup

```bash
cd frontend

# Copy env file
copy .env.local.example .env.local    # Windows
# cp .env.local.example .env.local    # macOS/Linux

# Install dependencies (already done if scaffolded)
npm install

# Run frontend dev server
npm run dev
```

Frontend will be available at: http://localhost:3000

---

## 10. Mock Mode

The backend ships with **mock implementations** of all AI services.

In `backend/.env`:

```env
AI_MOCK_MODE=true   # Uses demo data (default)
AI_MOCK_MODE=false  # Uses real AI modules from /ai/
```

**When `AI_MOCK_MODE=true`:**
- OCR returns: `"JOHN DEMO DOE"`, passport `"X12345678"`, confidence 94%
- Tampering returns: score 12 (LOW)
- Face verification returns: similarity 88.5% (MATCH)
- Result: LOW RISK

This lets you develop and demo the full pipeline without any AI models installed.

---

## 11. How Teammates Can Plug In Their AI Modules

### Step 1 — Create your module file

| Teammate | File to create |
|----------|---------------|
| OCR | `ai/ocr/ocr_module.py` |
| Tampering | `ai/tampering/tampering_module.py` |
| Face | `ai/face/face_module.py` |

### Step 2 — Implement the function

See `ai/*/README.md` for the exact function signature required.

### Step 3 — Add your dependencies

Add any new pip packages to `backend/requirements.txt` and run:
```bash
pip install -r requirements.txt
```

### Step 4 — Switch to real mode

In `backend/.env`:
```env
AI_MOCK_MODE=false
```

### Step 5 — Restart the backend

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The route, frontend, and risk engine do **not** need any changes.

---

## 12. Running Tests

```bash
cd backend

# Install test dependencies (included in requirements.txt)
pip install pytest pytest-asyncio httpx

# Run all tests
pytest ../tests/ -v

# Run specific test file
pytest ../tests/test_validation.py -v
pytest ../tests/test_risk_engine.py -v
pytest ../tests/test_api.py -v
```

---

## 13. Limitations

| Limitation | Why |
|-----------|-----|
| No database | MVP — per-request stateless processing |
| No authentication | Hackathon prototype |
| Mock AI by default | Real AI modules by teammates |
| No audit log | Out of scope for MVP |
| English only | OCR tuned for Latin script |
| JPEG/PNG/WebP only | Common formats only |
| Not mobile-optimised | Desktop-first prototype |
| No rate limiting | Hackathon demo only |

---

## 14. Demo Flow (for Judges)

1. Open http://localhost:3000
2. Upload a sample passport image from `sample_data/`
3. Upload a sample person photo
4. Click **Analyze Document**
5. Watch the pipeline complete
6. Review:
   - Personal information extracted by OCR
   - Validation result (PASS/WARNING)
   - Tampering score and level
   - Face similarity and match result
   - Risk score and final decision

---

## Project Structure

```
project-root/
├── frontend/          # Next.js + React + TypeScript + Tailwind
├── backend/           # Python + FastAPI
├── ai/
│   ├── ocr/           # ← Teammate 1 puts their OCR module here
│   ├── tampering/     # ← Teammate 2 puts their tampering module here
│   └── face/          # ← Teammate puts their face module here
├── sample_data/       # Synthetic demo images
├── tests/             # pytest test suite
├── docs/              # API contract
└── README.md
```

---

*Built with ❤️ for HACK-A-THRONE 2026*
