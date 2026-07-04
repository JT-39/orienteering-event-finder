import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { EventDetail } from "@/components/events/EventDetail";
import { getEventById } from "@/lib/events/queries";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEventById(id);

  if (!event) notFound();

  return (
    <>
      <Header />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6">
        <EventDetail
          event={{
            id: event.id,
            title: event.title,
            date: event.date,
            level: event.level,
            venue: event.venue,
            nearestTown: event.nearestTown,
            club: event.club,
            association: event.association,
            latitude: event.latitude,
            longitude: event.longitude,
            eventWebsite: event.eventWebsite,
          }}
        />
      </main>
    </>
  );
}
