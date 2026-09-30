"use client";

import { PlayIcon, ShuffleIcon } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { moshafQueue } from "@/lib/audio-url";
import { getLocalizedMoshafName, getLocalizedReciterName } from "@/lib/bengali-data";
import { matchesSurah } from "@/lib/search";
import { getSurah } from "@/lib/surahs";
import type { Reciter } from "@/lib/types";
import { shuffle } from "@/lib/utils";
import { usePlayerStore } from "@/stores/player-store";
import { EmptyState } from "./empty-state";
import { FavoriteReciterButton } from "./favorite-reciter-button";
import { ReciterAvatar } from "./reciter-avatar";
import { SearchInput } from "./search-input";
import { SurahRow } from "./surah-row";

export function ReciterView({ reciter }: { reciter: Reciter }) {
  const t = useTranslations();
  const locale = useLocale();
  const reciterDisplayName = getLocalizedReciterName(reciter.name, locale);
  const [moshafId, setMoshafId] = useState(() => {
    const current = usePlayerStore.getState().queue[usePlayerStore.getState().index];
    return reciter.moshafs.find((m) => m.id === current?.moshafId)?.id ?? reciter.moshafs[0]!.id;
  });
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);
  const moshaf = reciter.moshafs.find((m) => m.id === moshafId) ?? reciter.moshafs[0]!;
  const queue = useMemo(() => moshafQueue(reciter, moshaf), [reciter, moshaf]);
  const visible = queue.filter((track) => {
    const surah = getSurah(track.surah);
    return surah ? matchesSurah(surah, deferred) : false;
  });
  const { playQueue } = usePlayerStore.getState();

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <ReciterAvatar name={reciter.name} className="size-16 text-lg sm:size-20 sm:text-xl" />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{reciterDisplayName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {getLocalizedMoshafName(moshaf.name, locale)}, {t("reciters.complete")}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button size="lg" onClick={() => playQueue(queue, 0)}>
            <PlayIcon fill="currentColor" />
            {t("reciter.playAll")}
          </Button>
          <Button size="lg" variant="outline" onClick={() => playQueue(shuffle(queue), 0)}>
            <ShuffleIcon />
            {t("reciter.shuffle")}
          </Button>
          <FavoriteReciterButton id={reciter.id} name={reciter.name} />
        </div>
        {reciter.moshafs.length > 1 && (
          <div className="flex flex-col gap-2">
            <p id="recitation-label" className="text-sm font-medium">
              {t("reciter.chooseRecitation")}
            </p>
            <Tabs value={String(moshaf.id)} onValueChange={(value) => setMoshafId(Number(value))}>
              <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
                <TabsList aria-labelledby="recitation-label" className="w-max">
                  {reciter.moshafs.map((m) => (
                    <TabsTrigger key={m.id} value={String(m.id)}>
                      {getLocalizedMoshafName(m.name, locale)}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </Tabs>
          </div>
        )}
      </header>

      <section className="flex flex-col gap-4">
        <SearchInput
          value={query}
          onChange={setQuery}
          placeholder={t("reciter.filterPlaceholder")}
          label={t("reciter.filterLabel")}
          clearLabel={t("reciters.clearSearch")}
          className="max-w-sm"
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
      </section>
    </div>
  );
}
