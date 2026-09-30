"use client";

import { HeartIcon } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { EmptyState } from "@/components/empty-state";
import { FavoriteReciterButton } from "@/components/favorite-reciter-button";
import { ReciterAvatar } from "@/components/reciter-avatar";
import { SurahMark } from "@/components/surah-mark";
import { Button } from "@/components/ui/button";
import { getLocalizedReciterName, getLocalizedSurahName, getLocalizedSurahTranslation } from "@/lib/bengali-data";
import { getSurah } from "@/lib/surahs";
import { useLibraryStore } from "@/stores/library-store";

export function FavoritesPanel() {
  const t = useTranslations("library");
  const tt = useTranslations("track");
  const locale = useLocale();
  const reciters = useLibraryStore((s) => s.favoriteReciters);
  const surahs = useLibraryStore((s) => s.favoriteSurahs);
  const toggleSurah = useLibraryStore((s) => s.toggleFavoriteSurah);

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <section aria-labelledby="favorite-reciters-heading" className="flex flex-col gap-3">
        <h2 id="favorite-reciters-heading" className="text-lg font-semibold">
          {t("favoriteReciters")}
        </h2>
        {reciters.length === 0 ? (
          <EmptyState>{t("noFavoriteReciters")}</EmptyState>
        ) : (
          <ul className="flex flex-col gap-2">
            {reciters.map((reciter) => (
              <li key={reciter.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
                <Link
                  href={`/reciters/${reciter.id}`}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <ReciterAvatar name={reciter.name} />
                  <span className="truncate font-medium">{getLocalizedReciterName(reciter.name, locale)}</span>
                </Link>
                <FavoriteReciterButton id={reciter.id} name={reciter.name} />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="favorite-surahs-heading" className="flex flex-col gap-3">
        <h2 id="favorite-surahs-heading" className="text-lg font-semibold">
          {t("favoriteSurahs")}
        </h2>
        {surahs.length === 0 ? (
          <EmptyState>{t("noFavoriteSurahs")}</EmptyState>
        ) : (
          <ul className="flex flex-col gap-2">
            {surahs.map((id) => {
              const surah = getSurah(id);
              if (!surah) return null;
              return (
                <li key={id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
                  <Link
                    href={`/surahs/${id}`}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <SurahMark number={id} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{getLocalizedSurahName(surah, locale)}</span>
                      <span className="block truncate text-sm text-muted-foreground">{getLocalizedSurahTranslation(surah, locale)}</span>
                    </span>
                    <span className="font-arabic text-2xl leading-none" lang="ar" dir="rtl">
                      {surah.arabicName}
                    </span>
                  </Link>
                  <Button variant="outline" size="icon-lg" aria-label={tt("unfavoriteSurah")} aria-pressed onClick={() => toggleSurah(id)}>
                    <HeartIcon className="fill-current text-primary" />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
