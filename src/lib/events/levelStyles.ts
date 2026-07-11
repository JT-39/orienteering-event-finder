import { EventLevel } from "@/generated/prisma/enums";

export const LEVEL_LABEL: Record<EventLevel, string> = {
  LOCAL: "Local",
  REGIONAL: "Regional",
  NATIONAL: "National",
  MAJOR: "Major",
  INTERNATIONAL: "International",
  UNKNOWN: "Level TBC",
};

export const LEVEL_BADGE_CLASS: Record<EventLevel, string> = {
  LOCAL: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300",
  REGIONAL: "bg-sky-100 text-sky-800 dark:bg-sky-900/40 dark:text-sky-300",
  NATIONAL: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300",
  MAJOR: "bg-violet-100 text-violet-800 dark:bg-violet-900/40 dark:text-violet-300",
  INTERNATIONAL: "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-300",
  UNKNOWN: "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300",
};

export const LEVEL_DOT_CLASS: Record<EventLevel, string> = {
  LOCAL: "bg-emerald-500",
  REGIONAL: "bg-sky-500",
  NATIONAL: "bg-rose-500",
  MAJOR: "bg-violet-500",
  INTERNATIONAL: "bg-amber-500",
  UNKNOWN: "bg-stone-400",
};
