"use client";

import { BookOpen, ListVideoIcon, PlayIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { NowPlayingInfo } from "@/components/player/now-playing-info";
import { RepeatButton } from "@/components/player/repeat-button";
import { SeekBar } from "@/components/player/seek-bar";
import { SleepTimerMenu } from "@/components/player/sleep-timer-menu";
import { SpeedMenu } from "@/components/player/speed-menu";
import { TransportControls } from "@/components/player/transport-controls";
import { VolumeControl } from "@/components/player/volume-control";
import { SurahMark } from "@/components/surah-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { moshafQueue } from "@/lib/audio-url";
import { getLocalizedMoshafName, getLocalizedSurahName, toBengaliDigits } from "@/lib/bengali-data";
import { getSurah } from "@/lib/surahs";
import type { Reciter, Track } from "@/lib/types";
import { selectCurrentTrack, usePlayerStore } from "@/stores/player-store";
import { useSettingsStore } from "@/stores/settings-store";
import { IslamicWaveBackground } from "./islamic-wave-background";
import { LoopControls } from "./loop-controls";
import { ReciterPicker } from "./reciter-picker";
import type { Source } from "./use-player-source";

const LAST_SURAH = 114;

function runsToEnd(queue: Track[], index: number, track: Track) {
  const rest = queue.slice(index);
  return rest.length === LAST_SURAH - track.surah + 1 && rest.every((t, i) => t.moshafId === track.moshafId && t.surah === track.surah + i);
}

function NowPlaying({ track }: { track: Track }) {
  const t = useTranslations();
  const locale = useLocale();
  const surah = getSurah(track.surah);
  const next = usePlayerStore((s) => s.queue[s.index + 1]);
  const nextSurah = next ? getSurah(next.surah) : undefined;
  const nextName = nextSurah ? getLocalizedSurahName(nextSurah, locale) : undefined;
  const surahNum = surah ? (locale === "bn" ? toBengaliDigits(surah.id) : surah.id) : "";

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <p className="font-arabic text-6xl leading-tight text-primary drop-shadow-sm sm:text-7xl" lang="ar" dir="rtl">
        {surah?.arabicName}
      </p>
      {surah && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          <Badge variant="secondary">{t("playerPage.surahOf", { number: surahNum })}</Badge>
          <Badge variant="outline">{t(`surahs.${surah.revelation}`)}</Badge>
          <Badge variant="outline">{t("surahs.verses", { count: surah.versesCount })}</Badge>
        </div>
      )}
      <NowPlayingInfo track={track} size="lg" className="max-w-full" />
      <p className="text-xs text-muted-foreground">{nextName ? t("playerPage.upNext", { name: nextName }) : t("playerPage.endOfQueue")}</p>
    </div>
  );
}

export function NowPlayingPanel({
  reciters,
  source,
  onChoose,
  onViewLiveQuran,
}: {
  reciters: Reciter[];
  source: Source | null;
  onChoose: (reciterId: number, moshafId?: number) => void;
  onViewLiveQuran?: () => void;
}) {
  const t = useTranslations();
  const locale = useLocale();
  const track = usePlayerStore(selectCurrentTrack);
  const continues = usePlayerStore((s) => {
    const current = selectCurrentTrack(s);
    return current ? runsToEnd(s.queue, s.index, current) : false;
  });
  const autoNext = useSettingsStore((s) => s.autoNext);
  const setAutoNext = useSettingsStore((s) => s.setAutoNext);

  const playFrom = (surah: number) => {
    if (!source) return;
    const player = usePlayerStore.getState();
    const current = selectCurrentTrack(player);
    const sameTrack = current?.moshafId === source.moshaf.id && current.surah === surah;
    const ratio = sameTrack && player.duration ? player.currentTime / player.duration : undefined;
    setAutoNext(true);
    player.playQueue(moshafQueue(source.reciter, source.moshaf), surah - 1, { resumeRatio: ratio });
  };

  return (
    <section aria-label={t("player.label")} className="relative overflow-hidden flex flex-col gap-6 rounded-2xl border border-border/80 bg-card/95 backdrop-blur-md p-5 sm:p-6 shadow-sm">
      <IslamicWaveBackground />
      <div className="relative z-10 flex flex-col gap-6">
        {track ? (
          <NowPlaying track={track} />
        ) : (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <SurahMark number={1} className="size-14" />
            <p className="max-w-sm text-sm text-muted-foreground">{t("playerPage.nothingPlaying")}</p>
          </div>
        )}

      <div className="flex flex-col gap-3">
        <ReciterPicker reciters={reciters} selectedId={source?.reciter.id} onSelect={(id) => onChoose(id)} />
        {source && (
          <div className="flex flex-wrap items-center gap-2">
            {source.moshafs.length > 1 ? (
              <div className="-mx-1 max-w-full overflow-x-auto px-1">
                <Tabs value={String(source.moshaf.id)} onValueChange={(value) => onChoose(source.reciter.id, Number(value))}>
                  <TabsList aria-label={t("playerPage.recitation")} className="w-max">
                    {source.moshafs.map((m) => (
                      <TabsTrigger key={m.id} value={String(m.id)}>
                        {getLocalizedMoshafName(m.name, locale)}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                <span className="sr-only">{t("playerPage.recitation")}: </span>
                {getLocalizedMoshafName(source.moshaf.name, locale)}
              </p>
            )}
            {!source.moshaf.downloadable && <Badge variant="outline">{t("playerPage.streamOnly")}</Badge>}
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button size="lg" disabled={!source} onClick={() => playFrom(1)}>
            <PlayIcon fill="currentColor" />
            {t("playerPage.playAll")}
          </Button>
          {track && !continues && track.surah < LAST_SURAH && (
            <Button size="lg" variant="outline" disabled={!source} onClick={() => playFrom(track.surah)}>
              <ListVideoIcon />
              {t("playerPage.continueToEnd")}
            </Button>
          )}
          {onViewLiveQuran && track && (
            <Button size="lg" variant="outline" onClick={onViewLiveQuran} className="gap-2">
              <BookOpen className="size-4 text-primary" />
              {t("playerPage.tabs.live")}
            </Button>
          )}
        </div>
      </div>

      {track && (
        <>
          <div className="flex flex-col items-center gap-4">
            <SeekBar />
            <TransportControls size="lg" showSkip />
            <div className="flex w-full flex-wrap items-center justify-center gap-2">
              <RepeatButton />
              <SpeedMenu />
              <SleepTimerMenu />
              <VolumeControl />
            </div>
          </div>
          <label className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
            <Switch checked={autoNext} onCheckedChange={setAutoNext} />
            {t("player.autoNext")}
          </label>
          <LoopControls />
        </>
      )}
      </div>
    </section>
  );
}
