"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { withParams } from "@/lib/url";

export function AssociationFilter({
  associations,
}: {
  associations: { code: string; name: string }[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

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
    <details className="group relative">
      <summary className="flex list-none items-center gap-1.5 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm cursor-pointer select-none dark:border-white/10 dark:bg-white/5">
        {label}
        <ChevronDown className="size-3.5 text-foreground/50 transition group-open:rotate-180" />
      </summary>
      <div className="absolute z-10 mt-1.5 max-h-64 w-64 overflow-y-auto rounded-lg border border-black/10 bg-white p-2 shadow-lg dark:border-white/10 dark:bg-stone-900">
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
