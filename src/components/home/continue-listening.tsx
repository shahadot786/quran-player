"use client";

import { PauseIcon, PlayIcon } from "lucide-react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useTrackPlayback } from "@/hooks/use-track-playback";
import { trackKey } from "@/lib/audio-url";
import { getLocalizedReciterName, getLocalizedSurahName } from "@/lib/bengali-data";
import { formatTime } from "@/lib/format";
import { getSurah } from "@/lib/surahs";
import { useHydrated } from "@/stores/hydration";
import { usePlayerStore, type Position } from "@/stores/player-store";
import { EmptyState } from "../empty-state";
import { SurahMark } from "../surah-mark";

const LIMIT = 6;

function ResumeCard({ position }: { position: Position }) {
  const t = useTranslations();
  const locale = useLocale();
  const { track } = position;
  const surah = getSurah(track.surah);
  const { isCurrent, isPlaying, toggle } = useTrackPlayback(track);
  const time = usePlayerStore((s) => (isCurrent ? s.currentTime : position.time));
  const duration = usePlayerStore((s) => (isCurrent && s.duration ? s.duration : position.duration));
  if (!surah) return null;
  const percent = duration ? Math.min(100, (time / duration) * 100) : 0;
  const surahDisplayName = getLocalizedSurahName(surah, locale);
  const reciterDisplayName = getLocalizedReciterName(track.reciterName, locale);

  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
      <SurahMark number={surah.id} active={isCurrent} />
      <div className="min-w-0 flex-1">
        <Link href={`/surahs/${surah.id}`} className="block truncate font-medium hover:underline">
          {surahDisplayName}
        </Link>
        <p className="truncate text-xs text-muted-foreground">{reciterDisplayName}</p>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-border">
            <div className="h-full bg-gold" style={{ width: `${percent}%` }} />
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">{t("home.left", { time: formatTime(duration - time) })}</span>
        </div>
      </div>
      <Button
        size="icon-lg"
        variant={isCurrent ? "default" : "secondary"}
        className="rounded-full"
        onClick={() => toggle(usePlayerStore.getState().queue)}
        aria-label={isPlaying ? t("track.pause", { name: surahDisplayName }) : t("home.resumeAt", { time: formatTime(time) })}
      >
        {isPlaying ? <PauseIcon fill="currentColor" /> : <PlayIcon fill="currentColor" className="translate-x-px" />}
      </Button>
    </div>
  );
}

export function ContinueListening() {
  const t = useTranslations("home");
  const hydrated = useHydrated();
  const positions = usePlayerStore((s) => s.positions);
  const items = Object.values(positions)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, LIMIT);

  return (
    <section aria-labelledby="continue-heading" className="flex flex-col gap-4">
      <h2 id="continue-heading" className="text-lg font-semibold">
        {t("continue")}
      </h2>
      {!hydrated ? null : items.length === 0 ? (
        <EmptyState>{t("continueEmpty")}</EmptyState>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {items.map((position) => (
            <li key={trackKey(position.track)}>
              <ResumeCard position={position} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
