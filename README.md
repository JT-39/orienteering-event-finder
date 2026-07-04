# Orienteering Finder

A modern, friendly way to find and explore upcoming orienteering events across
the UK — map and list views, filters by date/level/association/keyword/distance,
event detail pages, and .ics calendar export.

Built with Next.js (App Router, TypeScript), Postgres via Prisma, and
MapLibre + free OpenStreetMap-based tiles (no API key required). Event data
comes from British Orienteering's public fixtures feed.

## Getting started (local dev)

Requires Node 22+, pnpm, and a local Postgres instance.

```bash
pnpm install

# Point DATABASE_URL in .env at your Postgres instance, then:
pnpm db:migrate   # create the schema
pnpm db:seed      # load ~20 realistic mock events (no network calls)
pnpm dev          # http://localhost:3000
```

`pnpm db:studio` opens Prisma Studio if you want to browse the data directly.

The seed data is fully offline — it's shaped exactly like the real British
Orienteering feed but ships with hardcoded coordinates, so the app is
completely demoable without any external network access.

## Real data ingestion

`pnpm ingest` (`scripts/ingest.ts`) fetches live fixtures from British
Orienteering's `fixturesjson.php` feed, geocodes any new venues (via
[postcodes.io](https://postcodes.io) for postcodes, falling back to
[Nominatim](https://nominatim.openstreetmap.org) for free-text place names,
both cached in the `GeocodeCache` table so repeat runs stay cheap), and
upserts everything into Postgres keyed by British Orienteering's own fixture
number — safe to re-run on a schedule.

This needs normal internet access to `britishorienteering.org.uk`,
`api.postcodes.io`, and `nominatim.openstreetmap.org`. Run it:

- **Locally**, on a machine with normal internet access.
- **On a schedule**, e.g. a GitHub Actions workflow (`schedule: cron`) that
  runs `pnpm ingest` against your production `DATABASE_URL`, or a cron job on
  a small VM.

For an offline dry run of the normalize → geocode → upsert pipeline against
local fixture data (useful in network-restricted environments), run:

```bash
pnpm exec tsx scripts/ingest.ts --file=prisma/seed-data/fixtures.mock.json
```

Geocoding calls will no-op gracefully (events just end up without
coordinates) if `api.postcodes.io` / `nominatim.openstreetmap.org` aren't
reachable — it never overwrites existing coordinates on failure, so it's
always safe to re-run.

## Project structure

- `prisma/schema.prisma` — `Event`, `Club`, `Association`, `GeocodeCache` models.
- `src/lib/ingest/` — fetch + normalize logic, shared by both the seed script and `pnpm ingest`.
- `src/lib/geocode/` — postcodes.io / Nominatim clients + the geocode cache.
- `src/lib/events/queries.ts` — shared filtering/query logic used by pages and the `/api/events` route.
- `src/components/map/EventMap.tsx` — MapLibre map view.
- `src/components/filters/` — the URL-state-synced filter bar.
- `src/app/events/[id]/page.tsx` — event detail page + `.ics` export.

Notifications (email/push alerts for nearby events) are intentionally out of
scope for this build, but nothing in the schema precludes adding a
`Subscription`/`Alert` model later.
