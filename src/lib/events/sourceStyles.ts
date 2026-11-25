import { EventSource } from "@/generated/prisma/enums";

// BOF (the official national feed) is the implied default and gets no
// badge — badging every card would just be noise. Only club-feed events
// are called out, since that's the thing worth knowing about a given card.
export const SOURCE_LABEL: Record<EventSource, string> = {
  BOF: "British Orienteering",
  CLUB_ICS: "Club calendar",
};

export const SOURCE_BADGE_CLASS: Record<EventSource, string> = {
  BOF: "",
  CLUB_ICS: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300",
};
