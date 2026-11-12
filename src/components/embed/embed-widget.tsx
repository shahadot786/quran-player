"use client";

import { useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useEmbedResize } from "@/hooks/use-embed-resize";
import { moshafQueue } from "@/lib/audio-url";
import { detailsUrl } from "@/lib/embed/links";
import type { EmbedOptions } from "@/lib/embed/options";
import type { WidgetReciter } from "@/lib/embed/reciters";
import { useHydrated } from "@/stores/hydration";
import { selectCurrentTrack, usePlayerStore } from "@/stores/player-store";
import { EmbedHeader } from "./embed-header";
import { EmbedPlayer } from "./embed-player";
import { EmbedStats } from "./embed-stats";
import { EmbedSurahList } from "./embed-surah-list";
import { useEmbedTracking } from "./use-embed-tracking";

export function EmbedWidget({ reciters, options }: { reciters: WidgetReciter[]; options: EmbedOptions }) {
  const t = useTranslations("embed");
  const hydrated = useHydrated();
  const track = usePlayerStore(selectCurrentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const [chosenId, setChosenId] = useState(options.reciter);
  const frame = useRef<HTMLDivElement>(null);
  useEmbedResize(frame);

  const playingReciter = track && reciters.find((r) => r.id === track.reciterId && r.moshaf.id === track.moshafId);
  const reciter = playingReciter ?? reciters.find((r) => r.id === chosenId) ?? reciters[0];
  const queue = useMemo(() => (reciter ? moshafQueue(reciter, reciter.moshaf) : []), [reciter]);
  const activeSurah = playingReciter && track ? track.surah : null;
  const trackEvent = useEmbedTracking(options.host, isPlaying ? activeSurah : null, !options.preview);

  const play = (surah: number) => usePlayerStore.getState().playQueue(queue, surah - 1);
  const changeReciter = (id: number) => {
    const next = reciters.find((r) => r.id === id);
    if (!next || next.id === reciter?.id) return;
    setChosenId(id);
    if (activeSurah) usePlayerStore.getState().playQueue(moshafQueue(next, next.moshaf), activeSurah - 1, { autoplay: isPlaying });
  };

  return (
    <div ref={frame}>
      {!hydrated ? (
        <div aria-busy className="min-h-48" />
      ) : !reciter ? (
        <p className="p-6 text-center text-sm text-muted-foreground">{t("unavailable")}</p>
      ) : (
        <main className="mx-auto flex w-full max-w-xl flex-col gap-3 p-3">
          <EmbedHeader reciters={reciters} reciterId={reciter.id} onChange={changeReciter} />
          <EmbedPlayer reciter={reciter} surahId={activeSurah} host={options.host} onStart={() => play(1)} onOpen={() => trackEvent("click")} />
          {options.size === "full" && (
            <>
              <EmbedStats />
              <EmbedSurahList activeSurah={activeSurah} onSelect={play} />
            </>
          )}
          <footer className="pb-1 text-center text-xs text-muted-foreground">
            <a
              href={detailsUrl({ host: options.host })}
              target="_blank"
              rel="noopener"
              onClick={() => trackEvent("click")}
              className="rounded-sm underline-offset-2 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {t("poweredBy")}
            </a>
          </footer>
        </main>
      )}
    </div>
  );
}
