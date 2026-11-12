"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { AudioLinesIcon } from "lucide-react";
import { SearchInput } from "@/components/search-input";
import { getLocalizedSurahName, getLocalizedSurahTranslation, toBengaliDigits } from "@/lib/bengali-data";
import { matchesSurah } from "@/lib/search";
import { SURAHS } from "@/lib/surahs";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/stores/player-store";

export function EmbedSurahList({ activeSurah, onSelect }: { activeSurah: number | null; onSelect: (surah: number) => void }) {
  const t = useTranslations("embed");
  const surahsT = useTranslations("surahs");
  const locale = useLocale();
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const [query, setQuery] = useState("");
  const list = useMemo(() => SURAHS.filter((surah) => matchesSurah(surah, query)), [query]);

  return (
    <section aria-labelledby="embed-surahs" className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm">
      <h2 id="embed-surahs" className="text-base font-semibold">
        {t("surahsTitle")}
      </h2>
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder={surahsT("searchPlaceholder")}
        label={surahsT("searchLabel")}
        clearLabel={surahsT("searchLabel")}
      />
      {list.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">{surahsT("empty", { query })}</p>
      ) : (
        <ul className="-mr-2 flex max-h-80 flex-col gap-1 overflow-y-auto pr-2">
          {list.map((surah) => {
            const active = surah.id === activeSurah;
            return (
              <li key={surah.id}>
                <button
                  type="button"
                  onClick={() => onSelect(surah.id)}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl p-2 text-start outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
                    active && "bg-primary/10",
                  )}
                >
                  <span
                    aria-hidden
                    className={cn(
                      "grid size-10 shrink-0 place-items-center rounded-full text-sm font-semibold tabular-nums",
                      active ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
                    )}
                  >
                    {active && isPlaying ? <AudioLinesIcon className="size-4" /> : locale === "bn" ? toBengaliDigits(surah.id) : surah.id}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{getLocalizedSurahName(surah, locale)}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {getLocalizedSurahTranslation(surah, locale)}, {surahsT("verses", { count: surah.versesCount })}
                    </span>
                  </span>
                  <span lang="ar" dir="rtl" className="shrink-0 font-arabic text-lg font-bold">
                    {surah.arabicName}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
