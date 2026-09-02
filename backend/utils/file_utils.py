"""
backend/utils/file_utils.py
---------------------------
Helpers for validating and temporarily handling uploaded image files.

Why a separate utils module?
  Keeps the route handler clean — it just calls helpers instead of
  repeating validation logic for each upload field.
"""

import os
import tempfile
import uuid
from pathlib import Path
from fastapi import UploadFile, HTTPException

# ─── Configuration ────────────────────────────────────────────────────────────

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
}

ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

# 10 MB limit — override with MAX_FILE_SIZE_MB env var
MAX_FILE_SIZE_BYTES = int(os.getenv("MAX_FILE_SIZE_MB", "10")) * 1024 * 1024


# ─── Validation ───────────────────────────────────────────────────────────────

def validate_image_file(file: UploadFile, field_name: str) -> None:
    """
    Raises HTTP 400 if the uploaded file is not a valid image
    or exceeds the size limit.

    Args:
        file:       The FastAPI UploadFile object.
        field_name: Human-readable name used in the error message.
    """
    # Check MIME type reported by browser
    if file.content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=400,
            detail=(
                f"'{field_name}' must be a JPEG, PNG, or WebP image. "
                f"Got: {file.content_type}"
            ),
        )

    # Check file extension as a secondary guard
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"'{field_name}' has an unsupported extension: '{ext}'. "
                f"Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
            ),
        )


async def read_and_validate(
    file: UploadFile, field_name: str
) -> bytes:
    """
    Read an uploaded file into bytes, validating type and size.

    Returns:
        Raw bytes of the file content.

    Raises:
        HTTPException 400 on bad type.
        HTTPException 413 on file too large.
    """
    validate_image_file(file, field_name)
    content = await file.read()

    if len(content) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail=(
                f"'{field_name}' is too large ({len(content) // 1024} KB). "
                f"Maximum allowed: {MAX_FILE_SIZE_BYTES // (1024*1024)} MB."
            ),
        )

    return content


def save_temp_file(data: bytes, suffix: str = ".jpg") -> str:
    """
    Save bytes to a named temporary file and return its path.

    The caller is responsible for deleting the file after use.
    We use a unique name to avoid collisions during concurrent requests.

    Returns:
        Absolute path to the temporary file.
    """
    tmp_dir = tempfile.gettempdir()
    filename = f"aidocs_{uuid.uuid4().hex}{suffix}"
    path = os.path.join(tmp_dir, filename)
    with open(path, "wb") as f:
        f.write(data)
    return path


def cleanup_temp_files(*paths: str) -> None:
    """Delete temporary files safely (ignores missing files)."""
    for path in paths:
        if path and os.path.exists(path):
            try:
                os.remove(path)
            except OSError:
                pass  # Non-critical — temp files are cleaned by OS eventually
