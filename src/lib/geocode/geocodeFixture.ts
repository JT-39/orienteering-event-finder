import { GeocodeSource } from "@/generated/prisma/enums";
import { getCachedGeocode, setCachedGeocode, type GeocodeHit } from "@/lib/geocode/cache";
import { looksLikePostcode, lookupPostcode } from "@/lib/geocode/postcodesIo";
import { searchPlace } from "@/lib/geocode/nominatim";

/** Resolves a venue/nearest_town pair to coordinates: cache first, then
 * postcodes.io if it looks like a postcode, then Nominatim free-text search.
 * Returns null (never throws) if nothing can be resolved, so ingestion can
 * still store the event without coordinates rather than dropping it. */
export async function geocodeVenue(venue: string | null, nearestTown: string | null): Promise<GeocodeHit | null> {
  const queryText = [venue, nearestTown].filter(Boolean).join(", ");
  if (!queryText) return null;

  const cached = await getCachedGeocode(queryText);
  if (cached) return cached;

  try {
    if (venue && looksLikePostcode(venue)) {
      const result = await lookupPostcode(venue);
      if (result) {
        const hit: GeocodeHit = { latitude: result.latitude, longitude: result.longitude, source: GeocodeSource.POSTCODES_IO };
        await setCachedGeocode(queryText, hit, result);
        return hit;
      }
    }

    const matches = await searchPlace(queryText, 1);
    if (matches.length > 0) {
      const hit: GeocodeHit = { latitude: matches[0].latitude, longitude: matches[0].longitude, source: GeocodeSource.NOMINATIM };
      await setCachedGeocode(queryText, hit, matches[0]);
      return hit;
    }
  } catch (err) {
    console.warn(`[geocode] failed for "${queryText}":`, err);
  }

  return null;
}
