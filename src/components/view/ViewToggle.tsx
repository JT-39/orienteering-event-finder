"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Map as MapIcon, List } from "lucide-react";

export function ViewToggle({ current }: { current: "map" | "list" }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setView(view: "map" | "list") {
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", view);
    router.push(`/?${params.toString()}`);
  }

  const options: { value: "map" | "list"; label: string; Icon: typeof MapIcon }[] = [
    { value: "map", label: "Map", Icon: MapIcon },
    { value: "list", label: "List", Icon: List },
  ];

  return (
    <div className="inline-flex rounded-lg border border-black/10 bg-white p-0.5 dark:border-white/10 dark:bg-white/5">
      {options.map(({ value, label, Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => setView(value)}
          className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition ${
            current === value
              ? "bg-emerald-700 text-white"
              : "text-foreground/70 hover:bg-black/5 dark:hover:bg-white/10"
          }`}
        >
          <Icon className="size-4" />
          {label}
        </button>
      ))}
    </div>
  );
}
