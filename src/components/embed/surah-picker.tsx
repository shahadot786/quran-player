"use client";

import { useCallback, useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { getLocalizedSurahName, toBengaliDigits } from "@/lib/bengali-data";
import { matchesSurah } from "@/lib/search";
import { getSurah, SURAHS } from "@/lib/surahs";
import { SearchPicker } from "./search-picker";

export function SurahPicker({ value, onSelect }: { value: number | null; onSelect: (surah: number) => void }) {
  const t = useTranslations("embed");
  const s = useTranslations("surahs");
  const locale = useLocale();

  const items = useMemo(
    () => SURAHS.map((surah) => ({ id: surah.id, label: `${locale === "bn" ? toBengaliDigits(surah.id) : surah.id}. ${getLocalizedSurahName(surah, locale)}`, trailing: surah.arabicName })),
    [locale],
  );
  const matches = useCallback((id: number, query: string) => matchesSurah(getSurah(id)!, query), []);

  return (
    <SearchPicker
      items={items}
      value={value}
      onSelect={onSelect}
      matches={matches}
      labels={{
        empty: t("chooseSurah"),
        prefix: t("chooseSurah"),
        search: s("searchLabel"),
        placeholder: s("searchPlaceholder"),
        list: t("chooseSurah"),
        noResults: (query) => s("empty", { query }),
      }}
    />
  );
}
