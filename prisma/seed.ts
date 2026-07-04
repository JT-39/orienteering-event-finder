import "dotenv/config";
import { GeocodeSource } from "@/generated/prisma/enums";
import { normalizeFixture } from "@/lib/ingest/normalize";
import { upsertEvent } from "@/lib/ingest/upsertEvent";
import type { RawFixture } from "@/types/fixtures";
import mockFixtures from "./seed-data/fixtures.mock.json";

type MockFixture = RawFixture & { lat: number | null; lng: number | null };

async function main() {
  const fixtures = mockFixtures as MockFixture[];
  let created = 0;
  let skipped = 0;

  for (const fixture of fixtures) {
    const normalized = normalizeFixture(fixture);
    if (!normalized) {
      skipped++;
      continue;
    }

    const geocode =
      fixture.lat != null && fixture.lng != null
        ? { latitude: fixture.lat, longitude: fixture.lng, source: GeocodeSource.MANUAL }
        : null;

    await upsertEvent(normalized, geocode);
    created++;
  }

  console.log(`Seeded ${created} events (${skipped} skipped as unparsable).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    const { prisma } = await import("@/lib/prisma");
    await prisma.$disconnect();
  });
