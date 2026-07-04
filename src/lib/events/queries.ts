import { prisma } from "@/lib/prisma";
import { boundingBox, haversineDistanceKm } from "@/lib/geo";
import type { EventFilters } from "@/lib/events/types";
import type { Prisma } from "@/generated/prisma/client";

const DEFAULT_PAGE_SIZE = 30;

export async function getEvents(filters: EventFilters) {
  const where: Prisma.EventWhereInput = {};

  if (filters.from || filters.to) {
    where.date = {
      ...(filters.from ? { gte: filters.from } : {}),
      ...(filters.to ? { lte: filters.to } : {}),
    };
  }

  if (filters.levels?.length) {
    where.level = { in: filters.levels };
  }

  if (filters.associationCodes?.length) {
    where.association = { code: { in: filters.associationCodes } };
  }

  if (filters.q) {
    where.OR = [
      { title: { contains: filters.q, mode: "insensitive" } },
      { venue: { contains: filters.q, mode: "insensitive" } },
      { nearestTown: { contains: filters.q, mode: "insensitive" } },
      { club: { name: { contains: filters.q, mode: "insensitive" } } },
    ];
  }

  if (filters.near) {
    const box = boundingBox(filters.near, filters.near.radiusKm);
    where.latitude = { gte: box.minLat, lte: box.maxLat };
    where.longitude = { gte: box.minLng, lte: box.maxLng };
  }

  const pageSize = filters.pageSize ?? DEFAULT_PAGE_SIZE;
  const page = filters.page ?? 1;

  const events = await prisma.event.findMany({
    where,
    include: { association: true, club: true },
    orderBy: { date: "asc" },
    // Distance filtering happens in JS below, so over-fetch a bit when a
    // radius search is active rather than paginating before distance is known.
    ...(filters.near ? {} : { skip: (page - 1) * pageSize, take: pageSize }),
  });

  if (!filters.near) {
    const total = await prisma.event.count({ where });
    return { events, total, page, pageSize };
  }

  const withDistance = events
    .filter((e) => e.latitude != null && e.longitude != null)
    .map((e) => ({
      ...e,
      distanceKm: haversineDistanceKm(filters.near!, { lat: e.latitude!, lng: e.longitude! }),
    }))
    .filter((e) => e.distanceKm <= filters.near!.radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm);

  const total = withDistance.length;
  const paged = withDistance.slice((page - 1) * pageSize, page * pageSize);

  return { events: paged, total, page, pageSize };
}

export async function getAssociations() {
  return prisma.association.findMany({ orderBy: { code: "asc" } });
}

export async function getEventById(id: string) {
  return prisma.event.findUnique({
    where: { id },
    include: { association: true, club: true },
  });
}
