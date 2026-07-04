import { EventLevel } from "@/generated/prisma/enums";
import type { RawFixture } from "@/types/fixtures";
import type { NormalizedEvent } from "@/lib/events/types";

const LEVEL_LOOKUP: Record<string, EventLevel> = {
  local: EventLevel.LOCAL,
  club: EventLevel.LOCAL,
  "colour coded": EventLevel.LOCAL,
  "colour-coded": EventLevel.LOCAL,
  regional: EventLevel.REGIONAL,
  district: EventLevel.REGIONAL,
  national: EventLevel.NATIONAL,
  major: EventLevel.MAJOR,
  international: EventLevel.INTERNATIONAL,
  a: EventLevel.MAJOR,
  b: EventLevel.NATIONAL,
  c: EventLevel.REGIONAL,
  d: EventLevel.LOCAL,
};

export function parseLevel(raw: string | null | undefined): EventLevel {
  if (!raw) return EventLevel.UNKNOWN;
  const key = raw.trim().toLowerCase();
  return LEVEL_LOOKUP[key] ?? EventLevel.UNKNOWN;
}

/**
 * BOF's feed hasn't published a guaranteed date format, so this tries the
 * formats known to show up in UK fixture feeds before giving up.
 */
export function parseFixtureDate(raw: string | null | undefined): Date | null {
  if (!raw) return null;
  const trimmed = raw.trim();

  const isoAttempt = new Date(trimmed);
  if (!Number.isNaN(isoAttempt.getTime()) && /^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    return isoAttempt;
  }

  const dmy = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    const year = y.length === 2 ? Number(y) + 2000 : Number(y);
    const date = new Date(Date.UTC(year, Number(m) - 1, Number(d)));
    if (!Number.isNaN(date.getTime())) return date;
  }

  const fallback = new Date(trimmed);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function cleanString(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/**
 * Converts one raw BOF fixture into our internal shape. Returns null (and logs)
 * for rows missing the fields we can't do anything without, rather than
 * throwing and aborting the whole ingestion run.
 */
export function normalizeFixture(raw: RawFixture): NormalizedEvent | null {
  const number = cleanString(raw.number);
  const title = cleanString(raw.title);
  const date = parseFixtureDate(raw.date);

  if (!number || !title || !date) {
    console.warn(
      `[normalize] skipping fixture, missing/unparsable required field: number=${raw.number} title=${raw.title} date=${raw.date}`,
    );
    return null;
  }

  return {
    bofNumber: number,
    title,
    date,
    level: parseLevel(raw.level),
    levelRaw: cleanString(raw.level),
    venue: cleanString(raw.venue),
    nearestTown: cleanString(raw.nearest_town),
    eventWebsite: cleanString(raw.event_specific_website),
    associationCode: cleanString(raw.assoc)?.toUpperCase() ?? null,
    clubName: cleanString(raw.club),
    rawPayload: raw,
  };
}
