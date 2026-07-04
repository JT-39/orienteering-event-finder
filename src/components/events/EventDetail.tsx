import Link from "next/link";
import { CalendarDays, MapPin, ExternalLink, ArrowLeft, Users } from "lucide-react";
import { EventMap } from "@/components/map/EventMap";
import { AddToCalendarButton } from "@/components/events/AddToCalendarButton";
import { LEVEL_BADGE_CLASS, LEVEL_LABEL } from "@/lib/events/levelStyles";
import type { EventCardData } from "@/components/events/EventCard";

export function EventDetail({ event }: { event: EventCardData }) {
  const location = [event.venue, event.nearestTown].filter(Boolean).join(", ");
  const hasCoords = event.latitude != null && event.longitude != null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div>
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to all events
        </Link>

        <div className="flex items-start justify-between gap-3">
          <h1 className="text-2xl font-semibold leading-tight">{event.title}</h1>
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${LEVEL_BADGE_CLASS[event.level]}`}>
            {LEVEL_LABEL[event.level]}
          </span>
        </div>

        <div className="mt-4 space-y-2.5 text-sm">
          <div className="flex items-center gap-2">
            <CalendarDays className="size-4 text-foreground/50" />
            {event.date.toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>
          {location && (
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-foreground/50" />
              {location}
            </div>
          )}
          <div className="flex items-center gap-2">
            <Users className="size-4 text-foreground/50" />
            {event.club?.name ?? "Club TBC"}
            {event.association ? ` · ${event.association.code}` : ""}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <AddToCalendarButton eventId={event.id} />
          {event.eventWebsite && (
            <a
              href={event.eventWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-black/10 px-4 py-2 text-sm font-medium hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
            >
              <ExternalLink className="size-4" />
              Event website
            </a>
          )}
        </div>
      </div>

      {hasCoords && (
        <EventMap
          events={[event]}
          center={{ longitude: event.longitude!, latitude: event.latitude! }}
          zoom={11}
          className="h-72 w-full overflow-hidden rounded-xl border border-black/5 lg:h-full dark:border-white/10"
        />
      )}
    </div>
  );
}
