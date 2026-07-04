import { EventLevel } from "@/generated/prisma/enums";
import type { EventFilters } from "@/lib/events/types";

export interface EventSearchParams {
  from?: string;
  to?: string;
  levels?: string;
  assoc?: string;
  q?: string;
  lat?: string;
  lng?: string;
  radius?: string;
  page?: string;
  view?: string;
  place?: string;
}

const VALID_LEVELS = new Set(Object.values(EventLevel));

/** Shared by the home page (server component) and the /api/events route so
 * both parse the same URL querystring shape into Prisma-ready filters. */
export function parseEventSearchParams(params: EventSearchParams): EventFilters {
  const filters: EventFilters = {};

  filters.from = params.from ? new Date(params.from) : new Date();
  if (params.to) filters.to = new Date(params.to);

  if (params.levels) {
    const levels = params.levels
      .split(",")
      .filter((l): l is EventLevel => VALID_LEVELS.has(l as EventLevel));
    if (levels.length) filters.levels = levels;
  }

  if (params.assoc) {
    filters.associationCodes = params.assoc.split(",").filter(Boolean);
  }

  if (params.q) filters.q = params.q;

  if (params.lat && params.lng) {
    filters.near = {
      lat: Number(params.lat),
      lng: Number(params.lng),
      radiusKm: params.radius ? Number(params.radius) : 40,
    };
  }

  if (params.page) filters.page = Number(params.page);

  return filters;
}
