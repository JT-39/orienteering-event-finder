"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { LocateFixed, MapPin, X } from "lucide-react";
import { withParams } from "@/lib/url";

interface Suggestion {
  label: string;
  latitude: number;
  longitude: number;
}

const RADII = [10, 25, 40, 80, 160];

export function LocationFilter() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const hasLocation = searchParams.has("lat") && searchParams.has("lng");
  const radius = searchParams.get("radius") ?? "40";

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [locating, setLocating] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(`/api/geocode/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });
        const body = await res.json();
        setSuggestions(body.results ?? []);
        setOpen(true);
      } catch {
        // aborted or network hiccup — leave existing suggestions as-is
      }
    }, 300);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  function goToLocation(lat: number, lng: number, label?: string) {
    router.push(
      `${pathname}?${withParams(searchParams, {
        lat: lat.toFixed(5),
        lng: lng.toFixed(5),
        radius,
        place: label ?? null,
      }).toString()}`,
    );
    setOpen(false);
    setQuery("");
  }

  function useMyLocation() {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        goToLocation(pos.coords.latitude, pos.coords.longitude, "My location");
      },
      () => setLocating(false),
      { timeout: 10000 },
    );
  }

  function clearLocation() {
    router.push(
      `${pathname}?${withParams(searchParams, { lat: null, lng: null, radius: null, place: null }).toString()}`,
    );
  }

  return (
    <div ref={containerRef} className="relative flex items-center gap-1.5">
      {hasLocation ? (
        <div className="flex items-center gap-1.5 rounded-lg border border-emerald-600/30 bg-emerald-50 px-2.5 py-1.5 text-sm text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-300">
          <MapPin className="size-3.5" />
          <span className="max-w-[8rem] truncate">{searchParams.get("place") ?? "Selected location"}</span>
          <select
            value={radius}
            onChange={(e) =>
              router.push(`${pathname}?${withParams(searchParams, { radius: e.target.value }).toString()}`)
            }
            className="rounded bg-transparent text-xs outline-none"
          >
            {RADII.map((r) => (
              <option key={r} value={r}>
                {r} km
              </option>
            ))}
          </select>
          <button type="button" onClick={clearLocation} aria-label="Clear location filter">
            <X className="size-3.5" />
          </button>
        </div>
      ) : (
        <>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            placeholder="Postcode or town…"
            className="w-40 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm outline-none focus:border-emerald-600 dark:border-white/10 dark:bg-white/5"
          />
          <button
            type="button"
            onClick={useMyLocation}
            disabled={locating}
            title="Use my location"
            className="flex items-center gap-1 rounded-lg border border-black/10 bg-white px-2 py-1.5 text-sm disabled:opacity-50 dark:border-white/10 dark:bg-white/5"
          >
            <LocateFixed className="size-4" />
          </button>
        </>
      )}

      {open && query.trim().length >= 2 && suggestions.length > 0 && (
        <div className="absolute top-full z-10 mt-1.5 w-64 rounded-lg border border-black/10 bg-white p-1 shadow-lg dark:border-white/10 dark:bg-stone-900">
          {suggestions.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => goToLocation(s.latitude, s.longitude, s.label)}
              className="block w-full truncate rounded-md px-2 py-1.5 text-left text-sm hover:bg-black/5 dark:hover:bg-white/10"
            >
              {s.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
