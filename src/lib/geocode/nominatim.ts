import type { PlaceSuggestion } from "@/lib/geocode/postcodesIo";

const MIN_DELAY_MS = 1100; // Nominatim usage policy: max 1 request/sec

let queue: Promise<unknown> = Promise.resolve();

/** Serializes all Nominatim calls process-wide with a >=1.1s gap, per the
 * Nominatim usage policy (nominatim.org/release-docs/latest/api/Search/). */
function throttled<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const result = await fn();
    await new Promise((resolve) => setTimeout(resolve, MIN_DELAY_MS));
    return result;
  });
  queue = run.catch(() => undefined);
  return run;
}

function userAgent(): string {
  return process.env.NOMINATIM_USER_AGENT ?? "orienteering-event-finder (no contact configured)";
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
}

/** Free-text UK place search, used as the fallback when a venue/nearest_town
 * string isn't postcode-shaped. Always serialized + rate-limited. */
export async function searchPlace(query: string, limit = 5): Promise<PlaceSuggestion[]> {
  return throttled(async () => {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("format", "json");
    url.searchParams.set("countrycodes", "gb");
    url.searchParams.set("q", query);
    url.searchParams.set("limit", String(limit));

    const res = await fetch(url, { headers: { "User-Agent": userAgent() } });
    if (!res.ok) return [];

    const results: NominatimResult[] = await res.json();
    return results.map((r) => ({
      label: r.display_name,
      latitude: Number(r.lat),
      longitude: Number(r.lon),
    }));
  });
}
