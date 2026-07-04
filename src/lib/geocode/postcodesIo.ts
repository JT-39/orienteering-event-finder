const POSTCODE_RE = /^[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}$/i;
const OUTCODE_RE = /^[A-Z]{1,2}\d[A-Z\d]?$/i;

export function looksLikePostcode(text: string): boolean {
  const trimmed = text.trim();
  return POSTCODE_RE.test(trimmed) || OUTCODE_RE.test(trimmed);
}

interface PostcodesIoResult {
  latitude: number;
  longitude: number;
  postcode: string;
}

/** Single postcode lookup via postcodes.io — free, no API key, no rate limit
 * concern at our volume. Returns null if the postcode isn't found. */
export async function lookupPostcode(postcode: string): Promise<PostcodesIoResult | null> {
  const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode.trim())}`);
  if (!res.ok) return null;
  const body = await res.json();
  if (body.status !== 200 || !body.result) return null;
  return { latitude: body.result.latitude, longitude: body.result.longitude, postcode: body.result.postcode };
}

/** Bulk postcode lookup (up to 100 per request per postcodes.io docs). Used by
 * the ingestion job so we don't make one HTTP round trip per fixture. */
export async function bulkLookupPostcodes(
  postcodes: string[],
): Promise<Map<string, PostcodesIoResult>> {
  const results = new Map<string, PostcodesIoResult>();
  if (postcodes.length === 0) return results;

  const res = await fetch("https://api.postcodes.io/postcodes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ postcodes: postcodes.slice(0, 100) }),
  });
  if (!res.ok) return results;

  const body = await res.json();
  for (const entry of body.result ?? []) {
    if (entry.result) {
      results.set(entry.query, {
        latitude: entry.result.latitude,
        longitude: entry.result.longitude,
        postcode: entry.result.postcode,
      });
    }
  }
  return results;
}

export interface PlaceSuggestion {
  label: string;
  latitude: number;
  longitude: number;
}

/** Postcode autocomplete + lookup, packaged as place suggestions for the
 * frontend location search box. */
export async function suggestPostcodes(partial: string, limit = 5): Promise<PlaceSuggestion[]> {
  const res = await fetch(
    `https://api.postcodes.io/postcodes/${encodeURIComponent(partial.trim())}/autocomplete?limit=${limit}`,
  );
  if (!res.ok) return [];
  const body = await res.json();
  const suggestions: string[] = body.result ?? [];

  const looked = await Promise.all(suggestions.map((pc) => lookupPostcode(pc)));
  return looked
    .filter((r): r is PostcodesIoResult => r != null)
    .map((r) => ({ label: r.postcode, latitude: r.latitude, longitude: r.longitude }));
}
