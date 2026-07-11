import { NextResponse } from "next/server";
import { getEventById } from "@/lib/events/queries";
import { buildIcs } from "@/lib/ics";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getEventById(id);
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const ics = buildIcs({
    title: event.title,
    date: event.date,
    location: [event.venue, event.nearestTown].filter(Boolean).join(", ") || null,
    url: event.eventWebsite,
    geo: event.latitude != null && event.longitude != null ? { lat: event.latitude, lon: event.longitude } : null,
  });

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.bofNumber}.ics"`,
    },
  });
}
