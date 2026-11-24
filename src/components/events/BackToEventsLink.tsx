"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

/** Goes back in browser history (preserving whatever filters/view were
 * active) rather than a plain link to "/", which would reset them. Falls
 * back to "/" if there's no in-app history to go back to (e.g. the detail
 * page was opened directly from a shared link). */
export function BackToEventsLink() {
  const router = useRouter();

  function handleClick() {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
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
