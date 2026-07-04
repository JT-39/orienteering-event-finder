import "dotenv/config";
import { readFile } from "node:fs/promises";
import { fetchFixturesFor, fetchAllFixturesByAssociation } from "@/lib/ingest/fetchFixtures";
import { normalizeFixture } from "@/lib/ingest/normalize";
import { geocodeVenue } from "@/lib/geocode/geocodeFixture";
import { upsertEvent } from "@/lib/ingest/upsertEvent";
import { ASSOCIATIONS } from "@/lib/ingest/associations";
import type { RawFixture } from "@/types/fixtures";

/** Production entrypoint for `pnpm ingest`. Fetches fixtures from British
 * Orienteering's live feed, geocodes new venues, and upserts into Postgres.
 *
 * This cannot be exercised live inside this project's dev sandbox (its
 * network policy blocks britishorienteering.org.uk, api.postcodes.io, and
 * nominatim.openstreetmap.org) — run it somewhere with normal internet
 * access, e.g. a scheduled GitHub Actions workflow or a cron job.
 *
 * For an offline dry run of the normalize/geocode/upsert pipeline against
 * local fixture data (no network calls), pass --file=path/to/fixtures.json,
 * pointing at JSON shaped like the raw BOF feed. */
async function loadFixtures(): Promise<RawFixture[]> {
  const fileArg = process.argv.find((arg) => arg.startsWith("--file="));
  if (fileArg) {
    const path = fileArg.slice("--file=".length);
    console.log(`[ingest] reading fixtures from local file: ${path} (no network calls)`);
    const contents = await readFile(path, "utf-8");
    return JSON.parse(contents);
  }

  const ukWide = await fetchFixturesFor();
  if (ukWide.length > 0) return ukWide;

  console.warn("[ingest] unparametrized fetch returned no fixtures, falling back to per-association fetch");
  return fetchAllFixturesByAssociation(Object.keys(ASSOCIATIONS));
}

async function main() {
  const fixtures = await loadFixtures();
  console.log(`[ingest] fetched ${fixtures.length} raw fixtures`);

  let upserted = 0;
  let skipped = 0;
  let geocoded = 0;
  let geocodeMissed = 0;

  for (const fixture of fixtures) {
    const normalized = normalizeFixture(fixture);
    if (!normalized) {
      skipped++;
      continue;
    }

    const geocode = await geocodeVenue(normalized.venue, normalized.nearestTown);
    if (geocode) geocoded++;
    else geocodeMissed++;

    await upsertEvent(normalized, geocode);
    upserted++;
  }

  console.log(
    `[ingest] done: ${upserted} upserted, ${skipped} skipped, ${geocoded} geocoded, ${geocodeMissed} without coordinates`,
  );
}

main()
  .catch((err) => {
    console.error("[ingest] fatal error:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    const { prisma } = await import("@/lib/prisma");
    await prisma.$disconnect();
  });
