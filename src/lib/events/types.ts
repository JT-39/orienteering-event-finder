import type { EventLevel } from "@/generated/prisma/enums";

export interface EventFilters {
  from?: Date;
  to?: Date;
  levels?: EventLevel[];
  associationCodes?: string[];
  q?: string;
  near?: { lat: number; lng: number; radiusKm: number };
  page?: number;
  pageSize?: number;
}

export interface NormalizedEvent {
  bofNumber: string;
  title: string;
  date: Date;
  level: EventLevel;
  levelRaw: string | null;
  venue: string | null;
  nearestTown: string | null;
  eventWebsite: string | null;
  associationCode: string | null;
  clubName: string | null;
  rawPayload: unknown;
}
