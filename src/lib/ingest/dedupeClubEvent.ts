import { prisma } from "@/lib/prisma";
import { EventSource } from "@/generated/prisma/enums";
import type { NormalizedEvent } from "@/lib/events/types";

const DATE_WINDOW_DAYS = 1; // guards against timezone/all-day boundary slop between feeds
const TITLE_OVERLAP_THRESHOLD = 0.5;
const VENUE_OVERLAP_THRESHOLD = 0.5;
const STOPWORDS = new Set(["orienteering", "event", "events", "the", "and", "at", "on", "of", "a", "for"]);

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 2 && !STOPWORDS.has(token)),
  );
}

/** True Jaccard similarity (intersection / union). Against the real feed,
 * dividing by the smaller set's size instead of the union massively
 * overcounted similarity — e.g. "SLOW Street-O" (tokens: slow, street)
 * vs. "MDOC Night Street League" (tokens: mdoc, night, street, league)
 * shares only "street", but 1/min(2,4) = 0.5 crossed the old threshold.
 * With the union (1/5 = 0.2) it correctly doesn't. */
function jaccardOverlap(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const token of a) if (b.has(token)) shared++;
  const union = a.size + b.size - shared;
  return shared / union;
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Checks whether a club-feed event likely duplicates an existing
 * BOF-sourced event (same real-world event, submitted to both the national
 * calendar and the club's own site). Deliberately simple — same-day title
 * or venue token overlap, both scored with the same Jaccard threshold — not
 * meant to be bulletproof, just good enough to avoid obvious duplicate
 * cards in the UI without also hiding genuinely distinct events.
 */
export async function findLikelyDuplicate(
  event: Extract<NormalizedEvent, { source: "CLUB_ICS" }>,
): Promise<{ id: string; title: string } | null> {
  const candidates = await prisma.event.findMany({
    where: {
      source: EventSource.BOF,
      date: { gte: addDays(event.date, -DATE_WINDOW_DAYS), lte: addDays(event.date, DATE_WINDOW_DAYS) },
    },
    select: { id: true, title: true, venue: true },
  });

  const targetTitleTokens = tokenize(event.title);
  const targetVenueTokens = event.venue ? tokenize(event.venue) : null;

  for (const candidate of candidates) {
    if (jaccardOverlap(targetTitleTokens, tokenize(candidate.title)) >= TITLE_OVERLAP_THRESHOLD) {
      return candidate;
    }
    if (targetVenueTokens && candidate.venue) {
      if (jaccardOverlap(targetVenueTokens, tokenize(candidate.venue)) >= VENUE_OVERLAP_THRESHOLD) {
        return candidate;
      }
    }
  }

  return null;
}
