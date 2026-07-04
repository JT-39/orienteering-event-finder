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
`api.postcodes.io`, and `nominatim.openstreetmap.org`. Run it locally, or let
`.github/workflows/ingest.yml` run it daily in CI (see Deploying below).

For an offline dry run of the normalize → geocode → upsert pipeline against
local fixture data (useful in network-restricted environments), run:

```bash
pnpm exec tsx scripts/ingest.ts --file=prisma/seed-data/fixtures.mock.json
```

Geocoding calls will no-op gracefully (events just end up without
coordinates) if `api.postcodes.io` / `nominatim.openstreetmap.org` aren't
reachable — it never overwrites existing coordinates on failure, so it's
always safe to re-run.

## Deploying (Vercel + Neon, via GitHub Actions)

`.github/workflows/deploy.yml` builds and deploys the app to Vercel on every
push to `main` (or manually via the Actions tab's "Run workflow" button).
`.github/workflows/ingest.yml` runs `pnpm ingest` daily to keep the DB fresh.
One-time setup:

1. **Database** — create a [Neon](https://neon.tech) Postgres project and
   copy its connection string.
2. **Vercel project** — create a Vercel project for this repo (via the
   dashboard's "Import Project", or `vercel link` locally). Either way, do
   **not** enable Vercel's own Git integration for this repo if you want
   GitHub Actions to be the thing that triggers deploys — otherwise you'll
   get two deploys per push, one from each. In the Vercel project's
   **Settings → Environment Variables**, add `DATABASE_URL` (Production) so
   the running app can reach Neon.
3. **GitHub repo secrets** (Settings → Secrets and variables → Actions):
   - `DATABASE_URL` — same Neon connection string as above (used by CI to run
     migrations and, daily, `pnpm ingest`).
   - `VERCEL_TOKEN` — from Vercel → Account Settings → Tokens.
   - `VERCEL_ORG_ID` and `VERCEL_PROJECT_ID` — from the project's
     Settings → General page, or the `.vercel/project.json` created by
     running `vercel link` locally once.
   - Optionally, a repo **variable** (not secret) `NOMINATIM_USER_AGENT` with
     a real contact email, per Nominatim's usage policy.
4. Push to `main` (or run the "Deploy to Vercel" workflow manually) —
   it applies pending migrations (`prisma migrate deploy`) and deploys.
5. Run the "Ingest fixtures" workflow manually once after the first deploy
   to populate real data (it otherwise runs daily on its own).

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
