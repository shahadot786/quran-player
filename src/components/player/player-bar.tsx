"use client";

import { ChevronUpIcon } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { getSurah } from "@/lib/surahs";
import { useHydrated } from "@/stores/hydration";
import { selectCurrentTrack, usePlayerStore } from "@/stores/player-store";
import { NowPlayingInfo } from "./now-playing-info";
import { QueueSheet } from "./queue-sheet";
import { RepeatButton } from "./repeat-button";
import { SeekBar } from "./seek-bar";
import { SleepTimerMenu } from "./sleep-timer-menu";
import { SpeedMenu } from "./speed-menu";
import { PlayPauseButton, TransportControls } from "./transport-controls";
import { VolumeControl } from "./volume-control";

function MiniProgress() {
  const progress = usePlayerStore((s) => (s.duration ? (s.currentTime / s.duration) * 100 : 0));
  return (
    <div className="absolute inset-x-0 top-0 h-0.5 bg-border" aria-hidden>
      <div className="h-full bg-gold transition-[width] duration-300" style={{ width: `${progress}%` }} />
    </div>
  );
}

export function PlayerBar() {
  const t = useTranslations("player");
  const hydrated = useHydrated();
  const track = usePlayerStore(selectCurrentTrack);
  const pathname = usePathname();

  if (!hydrated || !track || pathname === "/player") return null;
  const surah = getSurah(track.surah);

  return (
    <section aria-label={t("label")} className="relative border-t bg-card/95 backdrop-blur-md">
      <MiniProgress />

      <div className="flex items-center gap-3 px-3 py-2 lg:hidden">
        <Link
          href="/player"
          aria-label={t("expand")}
          className="flex min-w-0 flex-1 items-center gap-3 rounded-lg text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <span className="grid size-11 shrink-0 place-items-center rounded-lg bg-primary font-arabic text-lg text-primary-foreground" lang="ar" dir="rtl">
            {surah?.arabicName.replace(/^سورة\s*/, "").slice(0, 6)}
          </span>
          <NowPlayingInfo track={track} linked={false} />
        </Link>
        <PlayPauseButton />
      </div>

      <div className="hidden grid-cols-3 items-center gap-6 px-6 py-3 lg:grid">
        <div className="flex min-w-0 items-center gap-3">
          <span className="font-arabic text-3xl leading-none text-primary" lang="ar" dir="rtl">
            {surah?.arabicName}
          </span>
          <NowPlayingInfo track={track} />
          <Button asChild variant="ghost" size="icon-sm">
            <Link href="/player" aria-label={t("expand")}>
              <ChevronUpIcon />
            </Link>
          </Button>
        </div>
        <div className="flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <RepeatButton />
            <TransportControls />
            <SleepTimerMenu />
          </div>
          <SeekBar className="max-w-xl" />
        </div>
        <div className="flex items-center justify-end gap-1">
          <SpeedMenu />
          <QueueSheet />
          <VolumeControl />
        </div>
      </div>
    </section>
  );
}
