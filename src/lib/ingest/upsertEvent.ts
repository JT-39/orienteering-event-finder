import { prisma } from "@/lib/prisma";
import { associationName } from "@/lib/ingest/associations";
import type { NormalizedEvent } from "@/lib/events/types";
import type { GeocodeSource } from "@/generated/prisma/enums";

export interface GeocodeResult {
  latitude: number;
  longitude: number;
  source: GeocodeSource;
}

/** Upserts one normalized fixture (plus optional geocode result) into the DB,
 * find-or-creating its Association/Club first. Shared by the mock seed script
 * and the real ingestion script so both exercise the same write path. */
export async function upsertEvent(event: NormalizedEvent, geocode: GeocodeResult | null) {
  const association = event.associationCode
    ? await prisma.association.upsert({
        where: { code: event.associationCode },
        create: { code: event.associationCode, name: associationName(event.associationCode) },
        update: {},
      })
    : null;

  const club = event.clubName
    ? await prisma.club.upsert({
        where: { name: event.clubName },
        create: { name: event.clubName },
        update: {},
      })
    : null;

  return prisma.event.upsert({
    where: { bofNumber: event.bofNumber },
    create: {
      bofNumber: event.bofNumber,
      title: event.title,
      date: event.date,
      level: event.level,
      levelRaw: event.levelRaw,
      venue: event.venue,
      nearestTown: event.nearestTown,
      eventWebsite: event.eventWebsite,
      associationId: association?.id,
      clubId: club?.id,
      latitude: geocode?.latitude,
      longitude: geocode?.longitude,
      geocodeSource: geocode?.source,
      geocodedAt: geocode ? new Date() : undefined,
      rawPayload: event.rawPayload as never,
    },
    update: {
      title: event.title,
      date: event.date,
      level: event.level,
      levelRaw: event.levelRaw,
      venue: event.venue,
      nearestTown: event.nearestTown,
      eventWebsite: event.eventWebsite,
      associationId: association?.id,
      clubId: club?.id,
      ...(geocode
        ? {
            latitude: geocode.latitude,
            longitude: geocode.longitude,
            geocodeSource: geocode.source,
            geocodedAt: new Date(),
          }
        : {}),
      rawPayload: event.rawPayload as never,
    },
  });
}
