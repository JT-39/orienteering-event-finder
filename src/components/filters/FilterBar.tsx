import { DateRangeFilter } from "@/components/filters/DateRangeFilter";
import { LevelFilter } from "@/components/filters/LevelFilter";
import { AssociationFilter } from "@/components/filters/AssociationFilter";
import { LocationFilter } from "@/components/filters/LocationFilter";
import { KeywordSearch } from "@/components/filters/KeywordSearch";

export function FilterBar({ associations }: { associations: { code: string; name: string }[] }) {
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-black/5 bg-white/60 p-2.5 dark:border-white/10 dark:bg-white/5">
      <KeywordSearch />
      <DateRangeFilter />
      <LevelFilter />
      <AssociationFilter associations={associations} />
      <LocationFilter />
    </div>
  );
}
