/** British Orienteering regional association codes -> display names.
 * BOF doesn't expose a reliable "list all associations" endpoint, so this is
 * maintained by hand and should be reviewed occasionally. */
export const ASSOCIATIONS: Record<string, string> = {
  EMOA: "East Midlands Orienteering Association",
  SEOA: "South East Orienteering Association",
  SWOA: "South West Orienteering Association",
  WMOA: "West Midlands Orienteering Association",
  NWOA: "North West Orienteering Association",
  YHOA: "Yorkshire & Humberside Orienteering Association",
  NEOA: "North East Orienteering Association",
  EAOA: "East Anglian Orienteering Association",
  SOA: "Scottish Orienteering Association",
  WOA: "Welsh Orienteering Association",
  NIOA: "Northern Ireland Orienteering Association",
};

export function associationName(code: string): string {
  return ASSOCIATIONS[code] ?? code;
}
