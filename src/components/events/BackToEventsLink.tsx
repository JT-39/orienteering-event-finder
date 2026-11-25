"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { EVENTS_LIST_RETURN_KEY } from "@/lib/eventsListReturnUrl";

/** Returns to the events list with whatever filters/view were active,
 * using the URL the list page last recorded (see RecordEventsListUrl)
 * rather than browser history — history length/referrer can't reliably
 * tell an in-app previous page from an external one. Falls back to "/" if
 * no recorded URL exists (e.g. the detail page was opened directly from a
 * shared link). */
export function BackToEventsLink() {
  const router = useRouter();

  function handleClick() {
    let returnUrl: string | null = null;
    try {
      returnUrl = sessionStorage.getItem(EVENTS_LIST_RETURN_KEY);
    } catch {
      // sessionStorage unavailable — fall back to "/"
    }
    router.push(returnUrl ?? "/");
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="mb-4 inline-flex items-center gap-1.5 text-sm text-foreground/60 hover:text-foreground"
    >
      <ArrowLeft className="size-4" />
      Back to all events
    </button>
  );
}
