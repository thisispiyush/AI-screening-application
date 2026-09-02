# OCR Module — Integration Point

This folder is owned by **Teammate 1** (OCR module developer).

## What this module must provide

Implement the following function inside `ocr_module.py` (create this file here):

```python
def extract(passport_bytes: bytes, visa_bytes: bytes | None) -> dict:
    """
    Extract text fields from passport (and optionally visa) images.

    Args:
        passport_bytes: Raw bytes of the passport image file.
        visa_bytes:     Raw bytes of the visa image, or None if not uploaded.

    Returns:
        {
            "name":            str,   # Full name on document
            "passport_number": str,   # Passport number
            "nationality":     str,   # Country name or code
            "dob":             str,   # Date of birth — format "YYYY-MM-DD"
            "expiry":          str,   # Expiry date   — format "YYYY-MM-DD"
            "gender":          str,   # "M" or "F"
            "confidence":      float  # OCR confidence 0.0 – 1.0
        }

    Raises:
        Exception: If the image cannot be processed. The backend will catch this
                   gracefully and return a user-friendly error.
    """
    raise NotImplementedError("OCR module not yet implemented")
```

## How to activate your module

1. Create `ai/ocr/ocr_module.py` implementing the function above.
2. In `backend/.env`, set `AI_MOCK_MODE=false`.
3. The backend `OCRService` will automatically import from this file.

## Libraries you can use (add to backend/requirements.txt)
- `pytesseract` + `Pillow`
- `easyocr`
- `paddleocr`
- `rapidocr-onnxruntime`
