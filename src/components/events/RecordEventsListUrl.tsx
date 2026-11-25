"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { EVENTS_LIST_RETURN_KEY } from "@/lib/eventsListReturnUrl";

/** Mounted on the events list page only. Records the current URL (filters
 * and all) so BackToEventsLink can return to it verifiably, instead of
 * guessing from browser history. */
export function RecordEventsListUrl() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const query = searchParams.toString();
    const url = query ? `${pathname}?${query}` : pathname;
    try {
      sessionStorage.setItem(EVENTS_LIST_RETURN_KEY, url);
    } catch {
      // sessionStorage unavailable (private mode, etc.) — BackToEventsLink falls back to "/"
    }
  }, [pathname, searchParams]);

  return null;
}
