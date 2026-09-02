# Face Verification Module — Integration Point

This folder is owned by **Teammate 2** (or shared AI responsibility).

## What this module must provide

Implement the following function inside `face_module.py` (create this file here):

```python
def verify(passport_bytes: bytes, person_bytes: bytes) -> dict:
    """
    Compare the face on the passport photo with the live/person photo.

    Args:
        passport_bytes: Raw bytes of the passport image (face extracted internally).
        person_bytes:   Raw bytes of the live/person photo.

    Returns:
        {
            "similarity": float,  # Cosine or distance-based similarity 0.0 – 100.0
            "match":      bool    # True if similarity >= threshold (e.g. 60%)
        }

    Raises:
        Exception: If faces cannot be detected or compared.
    """
    raise NotImplementedError("Face verification module not yet implemented")
```

## How to activate your module

1. Create `ai/face/face_module.py` implementing the function above.
2. In `backend/.env`, set `AI_MOCK_MODE=false`.
3. The backend `FaceService` will automatically import from this file.

## Suggested libraries
- `deepface` (simplest, wraps multiple backends)
- `face_recognition` (dlib-based)
- `insightface` (ArcFace)
- `mediapipe` (Google, lightweight)
