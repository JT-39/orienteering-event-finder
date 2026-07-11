"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { withParams } from "@/lib/url";

function toInputValue(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function DateRangeFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const from = searchParams.get("from") ?? toInputValue(new Date());
  const to = searchParams.get("to") ?? "";

  function update(updates: Record<string, string | null>) {
    router.push(`${pathname}?${withParams(searchParams, updates).toString()}`);
  }

  return (
    <div className="flex items-center gap-1.5 text-sm">
      <input
        type="date"
        value={from}
        onChange={(e) => update({ from: e.target.value || null })}
        className="rounded-lg border border-black/10 bg-white px-2 py-1.5 outline-none focus:border-emerald-600 dark:border-white/10 dark:bg-white/5"
        aria-label="From date"
      />
      <span className="text-foreground/40">–</span>
      <input
        type="date"
        value={to}
        min={from}
        onChange={(e) => update({ to: e.target.value || null })}
        className="rounded-lg border border-black/10 bg-white px-2 py-1.5 outline-none focus:border-emerald-600 dark:border-white/10 dark:bg-white/5"
        aria-label="To date"
      />
    </div>
  );
}
