"use client";

import { ArrowDownIcon, ArrowUpIcon, XIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { EmptyState } from "@/components/empty-state";
import { SurahMark } from "@/components/surah-mark";
import { Button } from "@/components/ui/button";
import { trackKey } from "@/lib/audio-url";
import { getLocalizedReciterName, getLocalizedSurahName } from "@/lib/bengali-data";
import { getSurah } from "@/lib/surahs";
import { cn } from "@/lib/utils";
import { usePlayerStore } from "@/stores/player-store";

export function QueueList({ manage = false, className }: { manage?: boolean; className?: string }) {
  const t = useTranslations("player.queue");
  const tp = useTranslations("playlists");
  const locale = useLocale();
  const queue = usePlayerStore((s) => s.queue);
  const index = usePlayerStore((s) => s.index);
  const { jumpTo, removeFromQueue, moveInQueue } = usePlayerStore.getState();

  if (queue.length === 0) return <EmptyState className={className}>{t("empty")}</EmptyState>;

  return (
    <ol className={cn("flex flex-col", className)}>
      {queue.map((track, i) => {
        const surah = getSurah(track.surah);
        const name = surah ? getLocalizedSurahName(surah, locale) : String(track.surah);
        const reciterDisplayName = getLocalizedReciterName(track.reciterName, locale);
        const active = i === index;
        return (
          <li key={`${trackKey(track)}-${i}`} className={cn("flex items-center gap-1 rounded-lg pr-1", active && "bg-accent")}>
            <button
              type="button"
              onClick={() => jumpTo(i)}
              aria-current={active ? "true" : undefined}
              className="flex min-w-0 flex-1 items-center gap-3 rounded-lg p-2 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <SurahMark number={track.surah} active={active} className="size-9" />
              <span className="min-w-0 flex-1">
                <span className={cn("block truncate text-sm font-medium", active && "text-primary")}>{name}</span>
                <span className="block truncate text-xs text-muted-foreground">{reciterDisplayName}</span>
              </span>
              <span className="hidden font-arabic text-lg sm:inline" lang="ar" dir="rtl">
                {surah?.arabicName}
              </span>
            </button>
            {manage && (
              <>
                <Button variant="ghost" size="icon-sm" disabled={i === 0} aria-label={tp("moveUp", { name })} onClick={() => moveInQueue(i, i - 1)}>
                  <ArrowUpIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={i === queue.length - 1}
                  aria-label={tp("moveDown", { name })}
                  onClick={() => moveInQueue(i, i + 1)}
                >
                  <ArrowDownIcon />
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              disabled={active}
              onClick={() => removeFromQueue(i)}
              aria-label={t("remove", { name })}
              className={cn(active && "invisible")}
            >
              <XIcon />
            </Button>
          </li>
        );
      })}
    </ol>
  );
}
