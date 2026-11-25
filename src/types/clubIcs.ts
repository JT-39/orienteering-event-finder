/** Loosely-typed shape read off a parsed ICS VEVENT (via node-ical). Fields
 * are `unknown`, deliberately — same reasoning as `RawFixture`: we've never
 * fetched the real slow.org.uk feed in this dev sandbox (network-blocked),
 * so normalization must not assume node-ical's own types hold exactly. */
export interface RawIcsEvent {
  uid: unknown;
  summary: unknown;
  start: unknown;
  location: unknown;
  url: unknown;
}
