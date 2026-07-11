import Link from "next/link";
import { MapPin, CalendarDays } from "lucide-react";
import { LEVEL_BADGE_CLASS, LEVEL_LABEL } from "@/lib/events/levelStyles";
import type { EventLevel } from "@/generated/prisma/enums";

export interface EventCardData {
  id: string;
  title: string;
  date: Date;
  level: EventLevel;
  venue: string | null;
  nearestTown: string | null;
  club: { name: string } | null;
  association: { code: string } | null;
  latitude: number | null;
  longitude: number | null;
  eventWebsite: string | null;
  distanceKm?: number;
}

export function EventCard({ event }: { event: EventCardData }) {
  const location = [event.venue, event.nearestTown].filter(Boolean).join(", ");

  return (
    <Link
      href={`/events/${event.id}`}
      className="block rounded-xl border border-black/5 bg-white p-4 shadow-sm transition hover:shadow-md hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/5"
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold leading-snug">{event.title}</h3>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${LEVEL_BADGE_CLASS[event.level]}`}
        >
          {LEVEL_LABEL[event.level]}
        </span>
      </div>

      <div className="mt-2 space-y-1 text-sm text-foreground/70">
        <div className="flex items-center gap-1.5">
          <CalendarDays className="size-3.5 shrink-0" />
          <span>
            {event.date.toLocaleDateString("en-GB", {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
        {location && (
          <div className="flex items-center gap-1.5">
            <MapPin className="size-3.5 shrink-0" />
            <span>{location}</span>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-foreground/50">
        <span>{event.club?.name ?? "Club TBC"}</span>
        <span>
          {event.association?.code}
          {event.distanceKm != null ? ` · ${event.distanceKm.toFixed(1)} km away` : ""}
        </span>
      </div>
    </Link>
  );
}
