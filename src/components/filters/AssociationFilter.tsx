"use client";

import { useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronDown, X } from "lucide-react";
import { withParams } from "@/lib/url";

export function AssociationFilter({
  associations,
}: {
  associations: { code: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const detailsRef = useRef<HTMLDetailsElement>(null);

  const selected = new Set(searchParams.get("assoc")?.split(",").filter(Boolean) ?? []);

  function toggle(code: string) {
    const next = new Set(selected);
    if (next.has(code)) next.delete(code);
    else next.add(code);

    const value = next.size ? Array.from(next).join(",") : null;
    router.push(`${pathname}?${withParams(searchParams, { assoc: value }).toString()}`);
  }

  const label = selected.size
    ? `${selected.size} association${selected.size === 1 ? "" : "s"}`
    : "All associations";

  return (
    <details ref={detailsRef} className="group relative">
      <summary className="flex list-none items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm cursor-pointer select-none dark:border-white/10 dark:bg-white/5">
        {label}
        <ChevronDown className="size-3.5 text-foreground/50 transition group-open:rotate-180" />
      </summary>
      <div className="fixed inset-x-4 top-24 z-20 max-h-[70vh] overflow-y-auto rounded-lg border border-black/10 bg-white p-2 shadow-lg sm:absolute sm:inset-x-auto sm:top-full sm:left-0 sm:z-10 sm:mt-1.5 sm:max-h-64 sm:w-64 dark:border-white/10 dark:bg-stone-900">
        <div className="mb-1 flex items-center justify-between sm:hidden">
          <span className="px-2 text-sm font-medium">Associations</span>
          <button
            type="button"
            onClick={() => {
              if (detailsRef.current) detailsRef.current.open = false;
            }}
            aria-label="Close"
            className="rounded-md p-1 text-foreground/60 hover:bg-black/5 dark:hover:bg-white/10"
          >
            <X className="size-4" />
          </button>
        </div>
        {associations.map((assoc) => (
          <label
            key={assoc.code}
            className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-black/5 dark:hover:bg-white/10"
          >
            <input
              type="checkbox"
              checked={selected.has(assoc.code)}
              onChange={() => toggle(assoc.code)}
              className="accent-emerald-700"
            />
            <span className="font-medium">{assoc.code}</span>
            <span className="truncate text-foreground/60">{assoc.name}</span>
          </label>
        ))}
      </div>
    </details>
  );
}
