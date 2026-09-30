"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/empty-state";
import { SearchInput } from "@/components/search-input";
import { SurahRow } from "@/components/surah-row";
import { moshafQueue } from "@/lib/audio-url";
import { matchesSurah } from "@/lib/search";
import { getSurah } from "@/lib/surahs";
import type { Source } from "./use-player-source";

export function SurahPicker({ source }: { source: Source }) {
  const t = useTranslations();
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const queue = useMemo(() => moshafQueue(source.reciter, source.moshaf), [source.reciter, source.moshaf]);
  const visible = queue.filter((track) => {
    const surah = getSurah(track.surah);
    return surah ? matchesSurah(surah, deferred) : false;
  });

  return (
    <div className="flex flex-col gap-3">
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder={t("reciter.filterPlaceholder")}
        label={t("reciter.filterLabel")}
        clearLabel={t("reciters.clearSearch")}
      />
      {visible.length === 0 ? (
        <EmptyState>{t("reciter.noMatches", { query })}</EmptyState>
      ) : (
        <ul className="flex flex-col gap-0.5">
          {visible.map((track) => (
            <li key={track.surah}>
              <SurahRow track={track} queue={queue} context="reciter" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
