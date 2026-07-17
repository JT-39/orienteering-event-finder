# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Purpose

Orienteering Finder is a modern, consolidated way to find and browse upcoming orienteering events in the UK. It exists because the current options are fragmented and dated: British Orienteering's own event map, independent community maps like oobrien.com/map, and regional association pages like seoa.org.uk/events each show only part of the picture, with clunky UIs. This project pulls the same underlying British Orienteering fixture data into one modern, friendly interface — map and list views, real filtering (date, level, association, distance), and event detail pages with calendar export — so a user can find and plan around nearby events in one place instead of cross-referencing several sites.

Email/push notifications for nearby events were part of the original motivation but are explicitly deferred — the current build focuses on making discovery and browsing good first. When notifications are eventually tackled, there's no predetermined mechanism (email digest vs. push) — that's still an open decision, so don't assume one when designing for it.

**Scope and stakes**: this is primarily a personal project (built for the author's own use), not a commercial product — but written to a real-usage standard since it may end up shared with other orienteers if it proves useful, rather than staying purely a portfolio piece. UK-only is a permanent scope decision, not a "for now" placeholder — don't build toward international expansion speculatively.

**Unofficial tool**: this project republishes British Orienteering's public fixture data but is not affiliated with or endorsed by them. The site should carry a visible disclaimer to that effect (e.g. in the footer) — if you're adding UI and don't see one, it still needs to be added.

## Commands

```bash
pnpm dev               # dev server (localhost:3000)
pnpm build              # production build (also runs the TS check)
pnpm lint               # eslint

pnpm db:migrate         # prisma migrate dev — create/update local schema
pnpm db:migrate:deploy  # prisma migrate deploy — apply pending migrations, non-interactive (used in CI)
pnpm db:seed            # load prisma/seed-data/fixtures.mock.json (offline, no network calls)
pnpm db:studio          # Prisma Studio

pnpm ingest             # scripts/ingest.ts — fetch live BOF feed, geocode, upsert (needs real internet access)
pnpm exec tsx scripts/ingest.ts --file=prisma/seed-data/fixtures.mock.json  # offline dry run of the same pipeline
```

There is no test suite. `pnpm exec tsc --noEmit` and `pnpm exec eslint .` are the fast correctness checks; `pnpm build` is the real one (it also runs the TypeScript check as part of `next build`).

Local dev needs a running Postgres and `DATABASE_URL` set in `.env` (see `.env.example`). `pnpm db:migrate && pnpm db:seed && pnpm dev` gets you a fully working app with zero external network calls — seed data is realistic mock BOF fixtures with hardcoded coordinates.

## Architecture

**Data flow**: `britishorienteering.org.uk/fixturesjson.php` (raw JSON) → `src/lib/ingest/normalize.ts` (→ `NormalizedEvent`) → `src/lib/geocode/geocodeFixture.ts` (postcodes.io for postcode-shaped venues, Nominatim free-text fallback, both behind `GeocodeCache`) → `src/lib/ingest/upsertEvent.ts` (Prisma upsert keyed on BOF's own fixture `number`, stored as `Event.bofNumber`). This exact pipeline is shared by `scripts/ingest.ts` (production, live feed) and `prisma/seed.ts` (dev, local mock JSON with hardcoded lat/lng) — they differ only in where the raw fixtures and geocode results come from, not in normalization/upsert logic. When changing how a fixture field is parsed, edit `normalize.ts` once; both paths pick it up.

**The live BOF feed does not reliably match its own apparent schema** — e.g. `number` has been observed arriving as a JSON number rather than a string. `RawFixture` (`src/types/fixtures.ts`) types every field as `unknown` for this reason, and `normalize.ts`'s `cleanString`/`parseLevel`/`parseFixtureDate` all coerce defensively (`String(value)`) rather than assume `.trim()` exists. Don't loosen this back to typed strings without re-verifying against the real feed.

**Filter state lives in the URL**, not React state. `src/app/page.tsx` is a Server Component that reads `searchParams`, parses them via `src/lib/events/filterParams.ts` into `EventFilters`, and calls `src/lib/events/queries.ts#getEvents` directly (no client fetch on first paint). Filter components (`src/components/filters/*`) are client components that mutate the URL via `next/navigation` and let the server component re-render — there is no duplicate client-side filter state to keep in sync. `GET /api/events` exists for programmatic/external use and reuses the same `filterParams.ts`/`queries.ts`, but the page itself doesn't call it.

**Radius search** (`getEvents`'s `near` filter) does a cheap Postgres bounding-box pre-filter, then exact haversine distance + sort in JS (`src/lib/geo.ts`) on the smaller result set. This is intentional for the current data volume — don't reach for PostGIS unless the dataset grows enough to matter.

**Prisma 7 specifics**: the generator is `prisma-client` (not `prisma-client-js`), outputting to `src/generated/prisma` (gitignored) and imported as `@/generated/prisma/client` / `@/generated/prisma/enums`. It requires an explicit driver adapter — `src/lib/prisma.ts` constructs `PrismaClient` with `@prisma/adapter-pg`, not a bare `DATABASE_URL`. `postinstall: prisma generate` is load-bearing: the client doesn't exist after a fresh `pnpm install` otherwise, and nothing else regenerates it.

**Geocoding is best-effort, not required.** `Event.latitude`/`longitude` are nullable; an event with no resolvable geocode still gets upserted and still appears in list/keyword search, it just has no map marker. `upsertEvent.ts` only overwrites existing coordinates when a new geocode actually succeeds — a failed/no-op geocode run never clobbers previously-good coordinates.

**Deploy pipeline**: `.github/workflows/deploy.yml` runs `prisma migrate deploy` against the production `DATABASE_URL` secret, then builds and deploys to Vercel via the Vercel CLI (`vercel pull` → `vercel build` → `vercel deploy --prebuilt`), triggered on push to `main` or manual dispatch. `.github/workflows/ingest.yml` runs `pnpm ingest` on a daily cron against the same `DATABASE_URL`. Both need `DATABASE_URL`, plus `deploy.yml` needs `VERCEL_TOKEN`/`VERCEL_ORG_ID`/`VERCEL_PROJECT_ID` as repo secrets — see README "Deploying" for the one-time setup.

**Sandboxed dev environments typically cannot reach `britishorienteering.org.uk`, `api.postcodes.io`, or `nominatim.openstreetmap.org`** (network egress allowlists commonly block them). Don't treat a network failure from these as a code bug without checking connectivity first — use the `--file=` dry-run flag on `scripts/ingest.ts` to test the normalize/geocode/upsert pipeline without live network access, and rely on the GitHub Actions runs (which do have normal internet access) for real end-to-end verification.

Notifications (email/push alerts for nearby events) are explicitly out of scope — don't add them unless asked. Nothing in the schema precludes it later (a `Subscription`/`Alert` model would sit independently of `Event`).
