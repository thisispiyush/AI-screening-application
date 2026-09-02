"""
backend/main.py
----------------
FastAPI application entry point.

What this file does:
  1. Loads environment variables from .env
  2. Adds the project root to sys.path (so `ai.*` imports work)
  3. Creates the FastAPI app with metadata
  4. Configures CORS so the Next.js frontend can talk to this API
  5. Mounts the API router at /api
  6. Provides the Uvicorn entry-point for `python main.py`

To run:
  cd backend
  uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""

import sys
import os
import logging
from contextlib import asynccontextmanager
from pathlib import Path

# ─── Environment ──────────────────────────────────────────────────────────────
# Load .env before anything else so AI_MOCK_MODE etc. are available
from dotenv import load_dotenv
load_dotenv()  # reads backend/.env (or .env in cwd)

# ─── Path setup ───────────────────────────────────────────────────────────────
# Add the project root (one level up from /backend) to sys.path.
# This lets backend code import `ai.ocr.ocr_module` etc. when mock mode is off.
PROJECT_ROOT = Path(__file__).resolve().parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

# ─── Logging ──────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
)
logger = logging.getLogger(__name__)

# ─── FastAPI app ──────────────────────────────────────────────────────────────
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router

AI_MOCK_MODE = os.getenv("AI_MOCK_MODE", "true").lower() == "true"


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ───────────────────────────────────────────────────────────────
    logger.info("=" * 60)
    logger.info("AI Identity Document Screening System — Backend")
    logger.info(f"Mock mode: {'ON  (using demo data)' if AI_MOCK_MODE else 'OFF (using real AI)'}")
    logger.info("Docs: http://localhost:8000/docs")
    logger.info("=" * 60)
    yield
    # ── Shutdown (nothing to clean up in this stateless prototype) ────────────


app = FastAPI(
    title="AI Identity Document Screening System",
    description=(
        "Hackathon prototype — AI-assisted document screening. "
        "NOT a production government verification system."
    ),
    version="0.1.0",
    docs_url="/docs",       # Swagger UI available at http://localhost:8000/docs
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ─── CORS ─────────────────────────────────────────────────────────────────────
# Allows the Next.js dev server (port 3000) to call this API.
# In production you would restrict origins to your actual domain.
ALLOWED_ORIGINS = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Router ───────────────────────────────────────────────────────────────────
app.include_router(router, prefix="/api")

# ─── Dev runner ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
