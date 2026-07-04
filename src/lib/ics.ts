import { createEvent, type EventAttributes } from "ics";

export interface IcsEventInput {
  title: string;
  date: Date;
  location: string | null;
  url: string | null;
  geo: { lat: number; lon: number } | null;
}

export function buildIcs(event: IcsEventInput): string {
  const attributes: EventAttributes = {
    title: event.title,
    start: [event.date.getUTCFullYear(), event.date.getUTCMonth() + 1, event.date.getUTCDate()],
    duration: { days: 1 },
    location: event.location ?? undefined,
    url: event.url ?? undefined,
    geo: event.geo ?? undefined,
    calName: "Orienteering Finder",
  };

  const { error, value } = createEvent(attributes);
  if (error || !value) {
    throw error ?? new Error("Failed to build .ics file");
  }
  return value;
}
