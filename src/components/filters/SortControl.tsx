"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { withParams } from "@/lib/url";

export function SortControl() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sort = searchParams.get("sort") === "date" ? "date" : "distance";

  function setSort(value: "date" | "distance") {
    router.push(`${pathname}?${withParams(searchParams, { sort: value }).toString()}`);
  }

  return (
    <label className="flex items-center gap-1.5 text-sm text-foreground/60">
      Sort by
      <select
        value={sort}
        onChange={(e) => setSort(e.target.value as "date" | "distance")}
        className="rounded-lg border border-black/10 bg-white px-2 py-1 text-sm text-foreground outline-none focus:border-emerald-600 dark:border-white/10 dark:bg-white/5"
      >
        <option value="distance">Distance</option>
        <option value="date">Date</option>
      </select>
    </label>
  );
}
