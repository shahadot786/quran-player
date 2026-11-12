"use client";

import { ExternalLinkIcon, PlayIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { TransportControls } from "@/components/player/transport-controls";
import { SeekBar } from "@/components/player/seek-bar";
import { Button } from "@/components/ui/button";
import { getLocalizedReciterName, getLocalizedSurahName, getLocalizedSurahTranslation } from "@/lib/bengali-data";
import { detailsUrl } from "@/lib/embed/links";
import { notifyHost } from "@/lib/embed/host-bridge";
import type { WidgetReciter } from "@/lib/embed/reciters";
import { getSurah } from "@/lib/surahs";
import { usePlayerStore } from "@/stores/player-store";

export function EmbedPlayer({
  reciter,
  surahId,
  host,
  onStart,
  onOpen,
}: {
  reciter: WidgetReciter;
  surahId: number | null;
  host: string | null;
  onStart: () => void;
  onOpen: () => void;
}) {
  const t = useTranslations("embed");
  const player = useTranslations("player");
  const locale = useLocale();
  const failed = usePlayerStore((s) => s.status === "error");
  const surah = surahId ? getSurah(surahId) : undefined;
  const href = detailsUrl({ surah: surahId ?? undefined, host });

  return (
    <section aria-label={player("label")} className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{t("nowPlaying")}</p>
          {surah ? (
            <>
              <h2 className="truncate text-2xl font-bold tracking-tight">{getLocalizedSurahName(surah, locale)}</h2>
              <p className="truncate text-sm text-muted-foreground">{getLocalizedSurahTranslation(surah, locale)}</p>
            </>
          ) : (
            <h2 className="text-lg font-semibold">{t("startHint")}</h2>
          )}
        </div>
        {surah && (
          <span lang="ar" dir="rtl" className="shrink-0 font-arabic text-3xl leading-tight font-bold text-gold">
            {surah.arabicName}
          </span>
        )}
      </div>
      <span className="w-fit max-w-full truncate rounded-xl bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
        {getLocalizedReciterName(reciter.name, locale)}
      </span>
      {failed && (
        <p role="alert" className="text-sm text-destructive">
          {player("error")}{" "}
          <button type="button" onClick={() => usePlayerStore.getState().load(true)} className="font-medium underline underline-offset-2">
            {player("retry")}
          </button>
        </p>
      )}
      <SeekBar />
      <div className="flex flex-wrap items-center justify-between gap-2">
        {surah ? (
          <TransportControls />
        ) : (
          <Button size="icon" onClick={onStart} aria-label={player("play")} className="size-10 rounded-full">
            <PlayIcon className="size-5 translate-x-px" fill="currentColor" />
          </Button>
        )}
        <Button asChild variant="secondary" className="h-9 rounded-full px-4 text-primary">
          <a href={href} target="_blank" rel="noopener" onClick={() => {
              onOpen();
              notifyHost({ type: "tilawah:open", url: href });
            }}>
            {t("viewFull")}
            <span className="sr-only"> {t("opensNewTab")}</span>
            <ExternalLinkIcon aria-hidden />
          </a>
        </Button>
      </div>
    </section>
  );
}

