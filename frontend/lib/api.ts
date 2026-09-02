/**
 * frontend/lib/api.ts
 * --------------------
 * The single place where the frontend talks to the backend.
 *
 * WHY ONE FILE?
 *   If the backend URL changes, or you add auth headers later,
 *   you only change one file — not every component.
 *
 * ENVIRONMENT VARIABLE:
 *   NEXT_PUBLIC_API_URL — set in .env.local
 *   Defaults to http://localhost:8000 if not set.
 */

import type { ScreeningResponse } from "@/types/screening";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

// ─── Main API call ────────────────────────────────────────────────────────────

/**
 * Send the uploaded files to the backend and return the screening result.
 *
 * @param passport     - Passport image file (required)
 * @param personPhoto  - Live person photo file (required)
 * @param visa         - Visa image file (optional)
 * @throws Error with a user-friendly message on any failure
 */
export async function analyzeDocuments(
  passport: File,
  personPhoto: File,
  visa?: File | null
): Promise<ScreeningResponse> {
  const formData = new FormData();
  formData.append("passport", passport);
  formData.append("person_photo", personPhoto);
  if (visa) {
    formData.append("visa", visa);
  }

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: "POST",
      body: formData,
      // Do NOT set Content-Type header manually — the browser sets
      // multipart/form-data with the correct boundary automatically.
    });
  } catch {
    throw new Error(
      "Cannot reach the backend server. Is it running on " +
        API_BASE_URL +
        "?"
    );
  }

  if (!response.ok) {
    // Try to parse the FastAPI error detail
    let errorMessage = `Server error: ${response.status} ${response.statusText}`;
    try {
      const errorBody = await response.json();
      if (errorBody.detail) {
        errorMessage = errorBody.detail;
      } else if (errorBody.error) {
        errorMessage = errorBody.error;
      }
    } catch {
      // Couldn't parse — use the default message
    }
    throw new Error(errorMessage);
  }

  let data: ScreeningResponse;
  try {
    data = await response.json();
  } catch {
    throw new Error("The server returned an invalid response. Please try again.");
  }

  return data;
}
