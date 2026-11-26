import "dotenv/config";
import { fetchFixturesFor, fetchAllFixturesByAssociation } from "@/lib/ingest/fetchFixtures";
import { ASSOCIATIONS } from "@/lib/ingest/associations";
import type { RawFixture } from "@/types/fixtures";

function countsByAssoc(fixtures: RawFixture[]): Record<string, number> {
  const counts = new Map<string, number>();
  for (const f of fixtures) {
    const raw = (f as unknown as Record<string, unknown>).assoc;
    const key = raw == null || String(raw).trim() === "" ? "<null/empty>" : String(raw).trim();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Object.fromEntries(counts);
}

async function main() {
  const unparam = await fetchFixturesFor();
  console.log(`[debug] unparametrized fetch: ${unparam.length} fixtures`);
  console.log(`[debug] sample fixture[0]: ${JSON.stringify(unparam[0])}`);
  console.log(`[debug] sample fixture[500]: ${JSON.stringify(unparam[500])}`);
  console.log(`[debug] distinct assoc values (unparametrized): ${JSON.stringify(countsByAssoc(unparam))}`);

  const unparamNumbers = new Set(unparam.map((f) => String((f as unknown as Record<string, unknown>).number)));

  const perAssoc = await fetchAllFixturesByAssociation(Object.keys(ASSOCIATIONS));
  console.log(`[debug] per-association merged fetch: ${perAssoc.length} fixtures`);
  console.log(`[debug] distinct assoc values (per-association, after tagging): ${JSON.stringify(countsByAssoc(perAssoc))}`);

  const perAssocNumbers = new Set(perAssoc.map((f) => String((f as unknown as Record<string, unknown>).number)));
  const onlyInUnparam = [...unparamNumbers].filter((n) => !perAssocNumbers.has(n));
  const onlyInPerAssoc = [...perAssocNumbers].filter((n) => !unparamNumbers.has(n));
  console.log(`[debug] fixture numbers in unparametrized but NOT in per-association merge: ${onlyInUnparam.length}`);
  console.log(`[debug] sample of those: ${JSON.stringify(onlyInUnparam.slice(0, 5))}`);
  console.log(`[debug] fixture numbers in per-association merge but NOT in unparametrized: ${onlyInPerAssoc.length}`);
}

main().catch((err) => {
  console.error("[debug] fatal error:", err);
  process.exitCode = 1;
});
