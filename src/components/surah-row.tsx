"use client";

import { PauseIcon, PlayIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useTrackPlayback } from "@/hooks/use-track-playback";
import { getLocalizedReciterName, getLocalizedSurahName, getLocalizedSurahTranslation } from "@/lib/bengali-data";
import { getSurah } from "@/lib/surahs";
import type { Track } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SurahMark } from "./surah-mark";
import { DownloadedBadge, TrackMenu } from "./track-menu";

export function SurahRow({
  track,
  queue,
  subtitle,
  context,
}: {
  track: Track;
  queue: Track[];
  subtitle?: string;
  context: "reciter" | "surah" | "other";
}) {
  const t = useTranslations();
  const locale = useLocale();
  const surah = getSurah(track.surah);
  const { isCurrent, isPlaying, progress, toggle } = useTrackPlayback(track);
  if (!surah) return null;

  const surahName = getLocalizedSurahName(surah, locale);
  const reciterName = getLocalizedReciterName(track.reciterName, locale);
  const name = context === "surah" ? reciterName : surahName;
  const translation = getLocalizedSurahTranslation(surah, locale);
  const percent = Math.round(progress * 100);

  return (
    <div
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-accent/60 sm:gap-4 sm:px-3",
        isCurrent && "bg-accent",
      )}
    >
      <Button
        variant="ghost"
        size="icon-lg"
        onClick={() => toggle(queue)}
        aria-label={isPlaying ? t("track.pause", { name }) : t("track.play", { name })}
        className="relative size-10 shrink-0 rounded-full p-0"
      >
        <SurahMark number={surah.id} active={isCurrent} className={cn("transition-opacity group-hover:opacity-0 group-focus-within:opacity-0", isCurrent && "opacity-0")} />
        <span
          className={cn(
            "absolute inset-0 grid place-items-center rounded-full opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100",
            isCurrent && "bg-primary text-primary-foreground opacity-100",
          )}
        >
          {isPlaying ? <PauseIcon className="size-4" fill="currentColor" /> : <PlayIcon className="size-4 translate-x-px" fill="currentColor" />}
        </span>
      </Button>

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2">
          <span className={cn("truncate font-medium", isCurrent && "text-primary")}>{name}</span>
          <DownloadedBadge track={track} />
        </p>
        <p className="truncate text-sm text-muted-foreground">
          {subtitle ?? `${translation}, ${t("surahs.verses", { count: surah.versesCount })}`}
        </p>
        {percent > 0 && percent < 95 && (
          <div
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={t("track.progress", { percent })}
            className="mt-1.5 h-0.5 w-full max-w-40 overflow-hidden rounded-full bg-border"
          >
            <div className="h-full bg-gold" style={{ width: `${percent}%` }} />
          </div>
        )}
      </div>

      <span className="hidden font-arabic text-2xl leading-none text-foreground/80 sm:block" lang="ar" dir="rtl">
        {surah.arabicName}
      </span>
      <TrackMenu track={track} name={name} context={context} />
    </div>
  );
}
