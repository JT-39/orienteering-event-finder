/** Shape of a single fixture as returned by British Orienteering's fixturesjson.php feed. */
export interface RawFixture {
  number: string;
  title: string;
  date: string;
  club: string;
  level: string;
  venue: string;
  nearest_town: string;
  event_specific_website: string;
  assoc?: string;
}
