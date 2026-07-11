/** Shape of a single fixture as returned by British Orienteering's
 * fixturesjson.php feed. Fields are typed loosely (not all `string`) because
 * the live feed doesn't reliably match its own apparent schema — e.g.
 * `number` has been observed coming through as a JSON number, not a string. */
export interface RawFixture {
  number: unknown;
  title: unknown;
  date: unknown;
  club: unknown;
  level: unknown;
  venue: unknown;
  nearest_town: unknown;
  event_specific_website: unknown;
  assoc?: unknown;
}
