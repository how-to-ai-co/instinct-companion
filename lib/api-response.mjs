// Never expose proxy HTML or JSON parser exceptions as user-facing errors.
export async function readApiResponse(response) {
  if (response.status === 401) throw new Error("Please sign in again.");
  let data;
  try {
    data = JSON.parse(await response.text());
  } catch {
    throw new Error(
      `Instinct Companion returned an incomplete response (HTTP ${response.status}). Refresh to check the latest saved state before retrying a change.`,
    );
  }
  if (!data || typeof data !== "object" || Array.isArray(data))
    throw new Error(
      "Instinct Companion returned an unexpected response. Refresh to check the latest saved state.",
    );
  if (!response.ok)
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : `Instinct Companion could not complete the request (HTTP ${response.status}).`,
    );
  return data;
}
