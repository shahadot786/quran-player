"use client";

import { Trash2Icon } from "lucide-react";
import { useFormatter, useLocale, useNow, useTranslations } from "next-intl";
import { toast } from "sonner";
import { EmptyState } from "@/components/empty-state";
import { SurahRow } from "@/components/surah-row";
import { Button } from "@/components/ui/button";
import { trackKey } from "@/lib/audio-url";
import { getLocalizedReciterName } from "@/lib/bengali-data";
import { useLibraryStore } from "@/stores/library-store";

export function HistoryPanel() {
  const t = useTranslations("library.history");
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const history = useLibraryStore((s) => s.history);
  const locale = useLocale();

  if (history.length === 0) return <EmptyState>{t("empty")}</EmptyState>;

  const queue = history.map((entry) => entry.track);
  const clear = () => {
    useLibraryStore.getState().clearHistory();
    toast(t("cleared"));
  };

  return (
    <section className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button variant="outline" onClick={clear}>
          <Trash2Icon />
          {t("clear")}
        </Button>
      </div>
      <ul className="flex flex-col">
        {history.map(({ track, playedAt }) => {
          const reciterName = getLocalizedReciterName(track.reciterName, locale);
          return (
            <li key={trackKey(track)}>
              <SurahRow
                track={track}
                queue={queue}
                context="other"
                subtitle={`${reciterName}, ${t("playedAt", { when: format.relativeTime(playedAt, now) })}`}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
