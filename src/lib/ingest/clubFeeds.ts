export interface ClubFeedConfig {
  /** Short internal code, namespaces icsUid so two clubs' UIDs can't collide. */
  code: string;
  clubName: string;
  icsUrl: string;
  /** BOF association code to tag these events with for consistent filtering/display. */
  associationCode?: string;
}

/** Clubs whose own calendar feed we also ingest, alongside the official BOF
 * feed. Adding another club is just a new entry here — no code changes. */
export const CLUB_FEEDS: ClubFeedConfig[] = [
  {
    code: "SLOW",
    clubName: "South London Orienteers",
    icsUrl: "https://slow.org.uk/cal.php",
    associationCode: "SEOA",
  },
];
