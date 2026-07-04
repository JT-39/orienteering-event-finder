import { Header } from "@/components/layout/Header";
import { EventList } from "@/components/events/EventList";
import { EventMap } from "@/components/map/EventMap";
import { ViewToggle } from "@/components/view/ViewToggle";
import { FilterBar } from "@/components/filters/FilterBar";
import { getEvents, getAssociations } from "@/lib/events/queries";
import { parseEventSearchParams, type EventSearchParams } from "@/lib/events/filterParams";
import type { EventCardData } from "@/components/events/EventCard";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<EventSearchParams>;
}) {
  const params = await searchParams;
  const activeView = params.view === "list" ? "list" : "map";
  const filters = parseEventSearchParams(params);

  const [{ events, total }, associations] = await Promise.all([
    getEvents(filters),
    getAssociations(),
  ]);

  const eventData: EventCardData[] = events.map((e) => ({
    id: e.id,
    title: e.title,
    date: e.date,
    level: e.level,
    venue: e.venue,
    nearestTown: e.nearestTown,
    club: e.club,
    association: e.association,
    latitude: e.latitude,
    longitude: e.longitude,
    eventWebsite: e.eventWebsite,
    distanceKm: "distanceKm" in e ? (e.distanceKm as number) : undefined,
  }));

  return (
    <>
      <Header />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-3 px-4 py-6 sm:px-6">
        <FilterBar associations={associations} />
        <div className="flex items-center justify-between">
          <p className="text-sm text-foreground/60">
            {total} matching event{total === 1 ? "" : "s"}
          </p>
          <ViewToggle current={activeView} />
        </div>
        {activeView === "map" ? <EventMap events={eventData} /> : <EventList events={eventData} />}
      </main>
    </>
  );
}
