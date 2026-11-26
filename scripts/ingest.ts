import "dotenv/config";
import { readFile } from "node:fs/promises";
import { fetchAllFixturesByAssociation } from "@/lib/ingest/fetchFixtures";
import { normalizeFixture } from "@/lib/ingest/normalize";
import { geocodeVenue } from "@/lib/geocode/geocodeFixture";
import { upsertEvent } from "@/lib/ingest/upsertEvent";
import { ASSOCIATIONS } from "@/lib/ingest/associations";
import { CLUB_FEEDS } from "@/lib/ingest/clubFeeds";
import { fetchIcsFeed } from "@/lib/ingest/fetchClubIcs";
import { parseIcsEvents } from "@/lib/ingest/parseIcsFeed";
import { normalizeIcsEvent } from "@/lib/ingest/normalizeIcsEvent";
import { findLikelyDuplicate } from "@/lib/ingest/dedupeClubEvent";
import type { RawFixture } from "@/types/fixtures";

/** Production entrypoint for `pnpm ingest`. Fetches fixtures from British
 * Orienteering's live feed plus any configured club ICS calendar feeds,
 * geocodes new venues, and upserts into Postgres.
 *
 * This cannot be exercised live inside this project's dev sandbox (its
 * network policy blocks britishorienteering.org.uk, slow.org.uk,
 * api.postcodes.io, and nominatim.openstreetmap.org) — run it somewhere with
 * normal internet access, e.g. a scheduled GitHub Actions workflow or a cron
 * job.
 *
 * For an offline dry run of the normalize/geocode/upsert pipeline against
 * local fixture data (no network calls), pass --file=path/to/fixtures.json
 * for the BOF feed, and/or --ics-file=<CODE>=path/to/feed.ics (repeatable,
 * one per club feed code from clubFeeds.ts) for club calendars. */
async function loadFixtures(): Promise<RawFixture[]> {
  const fileArg = process.argv.find((arg) => arg.startsWith("--file="));
  if (fileArg) {
    const path = fileArg.slice("--file=".length);
    console.log(`[ingest] reading fixtures from local file: ${path} (no network calls)`);
    const contents = await readFile(path, "utf-8");
    return JSON.parse(contents);
  }

  // Confirmed against the real feed: the unparametrized endpoint doesn't
  // error or return nothing when it can't give UK-wide results — it silently
  // scoped every fixture to a single association (SEOA) instead, which
  // looked like a full, healthy fetch (937 rows) but wasn't. There's no
  // reliable signal to detect that from the response alone, so always fetch
  // per-association and merge instead of trusting the unparametrized call.
  return fetchAllFixturesByAssociation(Object.keys(ASSOCIATIONS));
}

function loadIcsOverrides(): Map<string, string> {
  const overrides = new Map<string, string>();
  for (const arg of process.argv) {
    if (!arg.startsWith("--ics-file=")) continue;
    const [code, path] = arg.slice("--ics-file=".length).split("=");
    if (code && path) overrides.set(code, path);
  }
  return overrides;
}

async function main() {
  const fixtures = await loadFixtures();
  console.log(`[ingest] fetched ${fixtures.length} raw fixtures`);

  let upserted = 0;
  let skipped = 0;
  let geocoded = 0;
  let geocodeMissed = 0;
  let duplicatesSkipped = 0;

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

  const icsOverrides = loadIcsOverrides();

  for (const feed of CLUB_FEEDS) {
    let icsText: string;
    try {
      icsText = await fetchIcsFeed(feed.icsUrl, icsOverrides.get(feed.code));
    } catch (err) {
      console.error(`[ingest] failed to fetch ICS feed for ${feed.code}, skipping this feed:`, err);
      continue;
    }

    const rawEvents = parseIcsEvents(icsText);
    console.log(`[ingest] fetched ${rawEvents.length} raw events from ${feed.code} ICS feed`);

    for (const raw of rawEvents) {
      const normalized = normalizeIcsEvent(raw, feed);
      if (!normalized) {
        skipped++;
        continue;
      }

      const duplicate = await findLikelyDuplicate(normalized);
      if (duplicate) {
        console.log(`[ingest] skipping likely duplicate of BOF event "${duplicate.title}" (${duplicate.id}): "${normalized.title}"`);
        duplicatesSkipped++;
        continue;
      }

      const geocode = await geocodeVenue(normalized.venue, normalized.nearestTown);
      if (geocode) geocoded++;
      else geocodeMissed++;

      await upsertEvent(normalized, geocode);
      upserted++;
    }
  }

  console.log(
    `[ingest] done: ${upserted} upserted, ${skipped} skipped, ${duplicatesSkipped} likely duplicates skipped, ${geocoded} geocoded, ${geocodeMissed} without coordinates`,
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
