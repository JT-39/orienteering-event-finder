import { CalendarPlus } from "lucide-react";

export function AddToCalendarButton({ eventId }: { eventId: string }) {
  return (
    <a
      href={`/api/events/${eventId}/ics`}
      download
      className="inline-flex items-center gap-2 rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800"
    >
      <CalendarPlus className="size-4" />
      Add to calendar
    </a>
  );
}
