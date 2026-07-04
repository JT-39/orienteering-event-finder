import Link from "next/link";
import { Compass } from "lucide-react";

export function Header() {
  return (
    <header className="border-b border-black/5 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-black/20">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <Compass className="size-5 text-emerald-700 dark:text-emerald-400" />
          <span>Orienteering Finder</span>
        </Link>
      </div>
    </header>
  );
}
