"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { getLocalizedReciterName } from "@/lib/bengali-data";
import { useHydrated } from "@/stores/hydration";
import { useLibraryStore } from "@/stores/library-store";
import { ReciterAvatar } from "../reciter-avatar";

export function FavoriteReciters() {
  const t = useTranslations("home");
  const locale = useLocale();
  const hydrated = useHydrated();
  const favorites = useLibraryStore((s) => s.favoriteReciters);
  if (!hydrated || favorites.length === 0) return null;

  return (
    <section aria-labelledby="favorites-heading" className="flex flex-col gap-4">
      <h2 id="favorites-heading" className="text-lg font-semibold">
        {t("favorites")}
      </h2>
      <ul className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {favorites.map((r) => (
          <li key={r.id} className="w-24 shrink-0">
            <Link
              href={`/reciters/${r.id}`}
              className="flex flex-col items-center gap-2 rounded-xl p-1 text-center outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <ReciterAvatar name={r.name} className="size-16 text-base" />
              <span className="line-clamp-2 text-xs font-medium">{getLocalizedReciterName(r.name, locale)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
