import { EventCard, type EventCardData } from "@/components/events/EventCard";

export function EventList({ events }: { events: EventCardData[] }) {
  if (events.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-black/10 p-12 text-center text-sm text-foreground/60 dark:border-white/10">
        No events match your filters. Try widening the date range or distance.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}
