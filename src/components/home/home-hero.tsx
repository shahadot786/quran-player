"use client";

import { PauseIcon, PlayIcon } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/format";
import { getLocalizedReciterName, getLocalizedSurahName } from "@/lib/bengali-data";
import { getSurah } from "@/lib/surahs";
import { useHydrated } from "@/stores/hydration";
import { selectCurrentTrack, usePlayerStore } from "@/stores/player-store";

export function HomeHero() {
  const t = useTranslations();
  const locale = useLocale();
  const hydrated = useHydrated();
  const track = usePlayerStore(selectCurrentTrack);
  const isPlaying = usePlayerStore((s) => s.isPlaying);
  const currentTime = usePlayerStore((s) => s.currentTime);
  const toggle = usePlayerStore((s) => s.toggle);
  const surah = track ? getSurah(track.surah) : undefined;
  const surahDisplayName = surah ? getLocalizedSurahName(surah, locale) : "";
  const reciterDisplayName = track ? getLocalizedReciterName(track.reciterName, locale) : "";

  if (!hydrated || !track || !surah) {
    return (
      <section className="flex flex-col gap-5 py-6 sm:py-10">
        <p className="text-muted-foreground">{t("home.greeting")}</p>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl">{t("home.title")}</h1>
        <div>
          <Button asChild size="lg">
            <Link href="/reciters">{t("home.browseReciters")}</Link>
          </Button>
        </div>
      </section>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-3xl bg-primary px-6 py-8 text-primary-foreground sm:px-10 sm:py-12">
      <p
        aria-hidden
        lang="ar"
        dir="rtl"
        className="pointer-events-none absolute -bottom-8 -left-4 font-arabic text-9xl leading-none whitespace-nowrap text-primary-foreground/10 select-none"
      >
        {surah.arabicName}
      </p>
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <p className="text-sm text-primary-foreground/75">{t("home.greeting")}</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{surahDisplayName}</h1>
          <p className="text-primary-foreground/80">{reciterDisplayName}</p>
          {!isPlaying && currentTime > 0 && (
            <p className="text-sm text-primary-foreground/75 tabular-nums">{t("home.resumeAt", { time: formatTime(currentTime) })}</p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <p className="font-arabic text-5xl leading-tight sm:text-6xl" lang="ar" dir="rtl">
            {surah.arabicName}
          </p>
          <Button
            size="icon"
            onClick={toggle}
            className="size-14 shrink-0 rounded-full bg-gold text-gold-foreground hover:bg-gold/90"
            aria-label={isPlaying ? t("player.pause") : t("home.resumeAt", { time: formatTime(currentTime) })}
          >
            {isPlaying ? <PauseIcon className="size-6" fill="currentColor" /> : <PlayIcon className="size-6 translate-x-px" fill="currentColor" />}
          </Button>
        </div>
      </div>
    </section>
  );
}
