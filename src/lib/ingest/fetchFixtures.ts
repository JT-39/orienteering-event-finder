import type { RawFixture } from "@/types/fixtures";

const BASE_URL = "https://www.britishorienteering.org.uk/fixturesjson.php";
const RETRY_DELAYS_MS = [1000, 2000, 4000];

async function fetchWithRetry(url: string): Promise<RawFixture[]> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`Fixtures feed returned HTTP ${res.status} for ${url}`);
      }
      const body = await res.json();
      return Array.isArray(body) ? body : (body.fixtures ?? []);
    } catch (err) {
      lastError = err;
      const delay = RETRY_DELAYS_MS[attempt];
      if (delay == null) break;
      console.warn(`[fetchFixtures] attempt ${attempt + 1} failed for ${url}, retrying in ${delay}ms:`, err);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

/** Fetches fixtures for one association code, or unparametrized if omitted.
 * Confirmed against the real feed: the unparametrized call doesn't return
 * UK-wide data — it silently scopes to a single association (observed:
 * everything came back tagged SEOA) while still returning a large,
 * healthy-looking result set. `scripts/ingest.ts` always loops
 * `associations.ts` and calls this once per code instead of relying on it. */
export async function fetchFixturesFor(assocCode?: string): Promise<RawFixture[]> {
  const url = assocCode ? `${BASE_URL}?assoc=${encodeURIComponent(assocCode)}` : BASE_URL;
  const fixtures = await fetchWithRetry(url);
  return assocCode ? fixtures.map((f) => ({ ...f, assoc: assocCode })) : fixtures;
}

/** Fetches per-association and dedupes by fixture `number`, for the case
 * where the unparametrized endpoint doesn't return UK-wide results. */
export async function fetchAllFixturesByAssociation(assocCodes: string[]): Promise<RawFixture[]> {
  const byNumber = new Map<string, RawFixture>();

  for (const code of assocCodes) {
    const fixtures = await fetchFixturesFor(code);
    for (const fixture of fixtures) {
      const key = String(fixture.number);
      if (!byNumber.has(key)) byNumber.set(key, fixture);
    }
  }

  return Array.from(byNumber.values());
}
