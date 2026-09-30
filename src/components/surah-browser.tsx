"use client";

import Link from "next/link";
import { useDeferredValue, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getLocalizedSurahName, getLocalizedSurahTranslation } from "@/lib/bengali-data";
import { matchesSurah } from "@/lib/search";
import { SURAHS } from "@/lib/surahs";
import { EmptyState } from "./empty-state";
import { SearchInput } from "./search-input";
import { SurahMark } from "./surah-mark";

type Filter = "all" | "meccan" | "medinan";

export function SurahBrowser() {
  const t = useTranslations("surahs");
  const tr = useTranslations("reciters");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const deferred = useDeferredValue(query);
  const results = SURAHS.filter((s) => (filter === "all" || s.revelation === filter) && matchesSurah(s, deferred));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder={t("searchPlaceholder")}
          label={t("searchLabel")}
          clearLabel={tr("clearSearch")}
          className="w-full max-w-md"
        />
        <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
          <TabsList>
            <TabsTrigger value="all">{t("all")}</TabsTrigger>
            <TabsTrigger value="meccan">{t("meccan")}</TabsTrigger>
            <TabsTrigger value="medinan">{t("medinan")}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      {results.length === 0 ? (
        <EmptyState>{t("empty", { query })}</EmptyState>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((s) => (
            <li key={s.id}>
              <Link
                href={`/surahs/${s.id}`}
                className="flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors outline-none hover:border-primary/40 hover:bg-accent/50 focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <SurahMark number={s.id} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{getLocalizedSurahName(s, locale)}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {getLocalizedSurahTranslation(s, locale)}, {t("verses", { count: s.versesCount })}
                  </span>
                </span>
                <span className="font-arabic text-2xl leading-none text-primary" lang="ar" dir="rtl">
                  {s.arabicName}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
