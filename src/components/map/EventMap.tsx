"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Map, Marker, Popup, NavigationControl, AttributionControl } from "@vis.gl/react-maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { LEVEL_DOT_CLASS, LEVEL_LABEL } from "@/lib/events/levelStyles";
import type { EventCardData } from "@/components/events/EventCard";

const MAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";
const UK_CENTER = { longitude: -2.5, latitude: 54.5 };

type MappableEvent = EventCardData & { latitude: number; longitude: number };

export function EventMap({
  events,
  center,
  zoom,
  className,
}: {
  events: EventCardData[];
  center?: { longitude: number; latitude: number };
  zoom?: number;
  className?: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<MappableEvent | null>(null);

  const mappable = useMemo(
    () => events.filter((e): e is MappableEvent => e.latitude != null && e.longitude != null),
    [events],
  );

  return (
    <div
      className={
        className ??
        "h-[calc(100vh-14rem)] min-h-[24rem] w-full overflow-hidden rounded-xl border border-black/5 dark:border-white/10"
      }
    >
      <Map
        initialViewState={{ ...(center ?? UK_CENTER), zoom: zoom ?? 5.2 }}
        mapStyle={MAP_STYLE}
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
      >
        <NavigationControl position="top-right" />
        <AttributionControl position="bottom-right" customAttribution="© OpenFreeMap © OpenMapTiles © OpenStreetMap contributors" />

        {mappable.map((event) => (
          <Marker
            key={event.id}
            longitude={event.longitude}
            latitude={event.latitude}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelected(event);
            }}
          >
            <span
              className={`block size-3.5 cursor-pointer rounded-full border-2 border-white shadow ${LEVEL_DOT_CLASS[event.level]}`}
              title={event.title}
            />
          </Marker>
        ))}

        {selected && (
          <Popup
            longitude={selected.longitude}
            latitude={selected.latitude}
            anchor="top"
            onClose={() => setSelected(null)}
            closeButton
          >
            <button
              type="button"
              onClick={() => router.push(`/events/${selected.id}`)}
              className="block w-56 cursor-pointer p-3 text-left"
            >
              <div className="text-sm font-semibold leading-snug">{selected.title}</div>
              <div className="mt-1 text-xs text-foreground/60">
                {selected.date.toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
                {" · "}
                {LEVEL_LABEL[selected.level]}
              </div>
              {(selected.venue || selected.nearestTown) && (
                <div className="mt-1 text-xs text-foreground/60">
                  {[selected.venue, selected.nearestTown].filter(Boolean).join(", ")}
                </div>
              )}
            </button>
          </Popup>
        )}
      </Map>
    </div>
  );
}
