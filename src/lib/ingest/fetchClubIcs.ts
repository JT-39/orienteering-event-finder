import { readFile } from "node:fs/promises";

const RETRY_DELAYS_MS = [1000, 2000, 4000];

async function fetchWithRetry(url: string): Promise<string> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!res.ok) {
        throw new Error(`ICS feed returned HTTP ${res.status} for ${url}`);
      }
      return await res.text();
    } catch (err) {
      lastError = err;
      const delay = RETRY_DELAYS_MS[attempt];
      if (delay == null) break;
      console.warn(`[fetchClubIcs] attempt ${attempt + 1} failed for ${url}, retrying in ${delay}ms:`, err);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

/** Fetches a club's raw .ics feed text. `localPathOverride` reads a local
 * file instead (no network call) — used for offline dry runs, same pattern
 * as `scripts/ingest.ts --file=` for the BOF feed. */
export async function fetchIcsFeed(icsUrl: string, localPathOverride?: string): Promise<string> {
  if (localPathOverride) {
    console.log(`[fetchClubIcs] reading ICS from local file: ${localPathOverride} (no network call)`);
    return readFile(localPathOverride, "utf-8");
  }
  return fetchWithRetry(icsUrl);
}
