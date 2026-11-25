import { EventLevel } from "@/generated/prisma/enums";
import { cleanString } from "@/lib/ingest/normalize";
import type { ClubFeedConfig } from "@/lib/ingest/clubFeeds";
import type { RawIcsEvent } from "@/types/clubIcs";
import type { NormalizedEvent } from "@/lib/events/types";

/**
 * Converts one raw ICS VEVENT occurrence into our internal shape. Same
 * defensive philosophy as `normalizeFixture`: returns null (and logs) for
 * events missing a field we can't do anything without, rather than
 * throwing and aborting the whole feed.
 */
export function normalizeIcsEvent(
  raw: RawIcsEvent,
  feed: ClubFeedConfig,
): Extract<NormalizedEvent, { source: "CLUB_ICS" }> | null {
  const uid = cleanString(raw.uid);
  const title = cleanString(raw.summary);
  const date = raw.start instanceof Date && !Number.isNaN(raw.start.getTime()) ? raw.start : null;

  if (!uid || !title || !date) {
    console.warn(
      `[normalizeIcsEvent] skipping VEVENT from ${feed.code}, missing/unparsable required field: uid=${raw.uid} summary=${raw.summary} start=${raw.start}`,
    );
    return null;
  }

  return {
    source: "CLUB_ICS",
    bofNumber: null,
    // Namespaced so two clubs' own UIDs can never collide in the shared unique column.
    icsUid: `${feed.code}:${uid}`,
    title,
    date,
    // No grading info in a club's own calendar — reuses the existing default/badge.
    level: EventLevel.UNKNOWN,
    levelRaw: null,
    // No structured venue/town split available from a single LOCATION field.
    venue: cleanString(raw.location),
    nearestTown: null,
    eventWebsite: cleanString(raw.url),
    associationCode: feed.associationCode ?? null,
    clubName: feed.clubName,
    rawPayload: raw,
  };
}
