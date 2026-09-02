# Tampering Detection Module — Integration Point

This folder is owned by **Teammate 2** (Tampering Detection module developer).

## What this module must provide

Implement the following function inside `tampering_module.py` (create this file here):

```python
def detect(passport_bytes: bytes, visa_bytes: bytes | None) -> dict:
    """
    Analyse passport (and optionally visa) images for signs of tampering.

    Args:
        passport_bytes: Raw bytes of the passport image file.
        visa_bytes:     Raw bytes of the visa image, or None if not uploaded.

    Returns:
        {
            "score":              float,      # Tampering suspicion score 0–100
            "issues":             list[str],  # Human-readable issue descriptions
            "suspicious_regions": list[str]   # Region labels e.g. ["photo_zone", "mrz"]
        }

    Raises:
        Exception: If the image cannot be processed. The backend will catch this.
    """
    raise NotImplementedError("Tampering module not yet implemented")
```

## Score interpretation
- 0–30 → LOW (clean document)  
- 31–70 → MEDIUM (worth reviewing)  
- 71–100 → HIGH (strong suspicion)

## How to activate your module

1. Create `ai/tampering/tampering_module.py` implementing the function above.
2. In `backend/.env`, set `AI_MOCK_MODE=false`.
3. The backend `TamperingService` will automatically import from this file.

## Suggested techniques
- ELA (Error Level Analysis) with Pillow
- Noise analysis / PRNU
- Copy-move detection with OpenCV
- Pre-trained forensics CNN (e.g. MantraNet, MVSS-Net)
