"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { withParams } from "@/lib/url";

export function KeywordSearch() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlValue = searchParams.get("q") ?? "";
  const [value, setValue] = useState(urlValue);
  const [syncedUrlValue, setSyncedUrlValue] = useState(urlValue);

  // Keep the input in sync when "q" changes externally (e.g. cleared by
  // another control, or browser back/forward) — updating state during
  // render here, not in an effect, per https://react.dev/learn/you-might-not-need-an-effect
  if (urlValue !== syncedUrlValue) {
    setSyncedUrlValue(urlValue);
    setValue(urlValue);
  }

  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (value === current) return;

    const timeout = setTimeout(() => {
      router.push(`${pathname}?${withParams(searchParams, { q: value || null }).toString()}`);
    }, 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div className="relative flex-1 min-w-[10rem]">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-foreground/40" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search title, club, venue…"
        className="w-full rounded-lg border border-black/10 bg-white py-1.5 pl-8 pr-3 text-sm outline-none focus:border-emerald-600 dark:border-white/10 dark:bg-white/5"
      />
    </div>
  );
}
