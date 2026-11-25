import ical from "node-ical";
import type { VEvent } from "node-ical";
import type { RawIcsEvent } from "@/types/clubIcs";

const HORIZON_MONTHS = 18;

/** node-ical returns some text fields (summary/location) as a plain string,
 * or as `{ val, params }` when the source property had iCal parameters
 * (e.g. `SUMMARY;LANGUAGE=en:...`). Never assume which shape we got. */
function unwrapIcsValue(value: unknown): unknown {
  if (value && typeof value === "object" && "val" in value) {
    return (value as { val: unknown }).val;
  }
  return value;
}

function toRawEvent(uid: unknown, vevent: VEvent, start: unknown): RawIcsEvent {
  return {
    uid,
    summary: unwrapIcsValue(vevent.summary),
    start,
    location: unwrapIcsValue(vevent.location),
    url: vevent.url,
  };
}

/** Parses raw .ics text into a flat list of (possibly recurrence-expanded)
 * VEVENT occurrences. Never assumes a VEVENT has every field RFC 5545 would
 * suggest — the real slow.org.uk feed has never been exercised against this
 * code (network-blocked in this dev sandbox), so downstream normalization
 * (not this function) is where defensive field coercion happens; this
 * function's job is just "turn the feed into a flat array of candidates." */
export function parseIcsEvents(icsText: string): RawIcsEvent[] {
  const parsed = ical.sync.parseICS(icsText);
  const events: RawIcsEvent[] = [];

  const from = new Date();
  const to = new Date(from);
  to.setMonth(to.getMonth() + HORIZON_MONTHS);

  for (const component of Object.values(parsed)) {
    if (!component || typeof component !== "object" || component.type !== "VEVENT") continue;
    const vevent = component;

    if (vevent.rrule) {
      let instances;
      try {
        instances = ical.expandRecurringEvent(vevent, { from, to });
      } catch (err) {
        console.warn(`[parseIcsFeed] failed to expand recurring VEVENT ${vevent.uid}:`, err);
        continue;
      }
      for (const instance of instances) {
        events.push(toRawEvent(`${vevent.uid}:${instance.start.toISOString()}`, instance.event, instance.start));
      }
    } else {
      events.push(toRawEvent(vevent.uid, vevent, vevent.start));
    }
  }

  return events;
}
