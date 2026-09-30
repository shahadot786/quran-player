"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toTrack } from "@/lib/audio-url";
import { getLocalizedMoshafName } from "@/lib/bengali-data";
import { matchesName } from "@/lib/search";
import type { Reciter, Surah } from "@/lib/types";
import { EmptyState } from "./empty-state";
import { SearchInput } from "./search-input";
import { SurahRow } from "./surah-row";

export function SurahReciters({ surah, reciters }: { surah: Surah; reciters: Reciter[] }) {
  const t = useTranslations("surahs");
  const tr = useTranslations("reciters");
  const locale = useLocale();
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const tracks = useMemo(
    () => reciters.flatMap((r) => r.moshafs.map((m) => ({ track: toTrack(r, m, surah.id), multi: r.moshafs.length > 1 }))),
    [reciters, surah.id],
  );
  const visible = tracks.filter(({ track }) => matchesName(track.reciterName, deferred));

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold">{t("chooseReciter")}</h2>
      <SearchInput
        value={query}
        onChange={setQuery}
        placeholder={t("filterReciters")}
        label={t("filterReciters")}
        clearLabel={tr("clearSearch")}
        className="max-w-sm"
      />
      {visible.length === 0 ? (
        <EmptyState>{t("noReciters", { query })}</EmptyState>
      ) : (
        <ul className="flex flex-col gap-0.5">
          {visible.map(({ track, multi }) => (
            <li key={track.moshafId}>
              <SurahRow track={track} queue={[track]} context="surah" subtitle={multi ? getLocalizedMoshafName(track.moshafName, locale) : undefined} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
