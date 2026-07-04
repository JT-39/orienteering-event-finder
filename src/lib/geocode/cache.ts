import { prisma } from "@/lib/prisma";
import type { GeocodeSource } from "@/generated/prisma/enums";

export interface GeocodeHit {
  latitude: number;
  longitude: number;
  source: GeocodeSource;
}

function normalizeKey(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

export async function getCachedGeocode(queryText: string): Promise<GeocodeHit | null> {
  const hit = await prisma.geocodeCache.findUnique({ where: { queryText: normalizeKey(queryText) } });
  return hit ? { latitude: hit.latitude, longitude: hit.longitude, source: hit.source } : null;
}

export async function setCachedGeocode(
  queryText: string,
  hit: GeocodeHit,
  raw?: unknown,
): Promise<void> {
  const key = normalizeKey(queryText);
  await prisma.geocodeCache.upsert({
    where: { queryText: key },
    create: { queryText: key, latitude: hit.latitude, longitude: hit.longitude, source: hit.source, raw: raw as never },
    update: { latitude: hit.latitude, longitude: hit.longitude, source: hit.source, raw: raw as never },
  });
}
