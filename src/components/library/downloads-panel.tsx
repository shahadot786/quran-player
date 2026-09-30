"use client";

import { useLocale, useTranslations } from "next-intl";
import { EmptyState } from "@/components/empty-state";
import { SurahRow } from "@/components/surah-row";
import { getLocalizedReciterName } from "@/lib/bengali-data";
import { formatBytes } from "@/lib/format";
import { useDownloadsStore } from "@/stores/downloads-store";

export function DownloadsPanel() {
  const t = useTranslations("downloads");
  const locale = useLocale();
  const records = useDownloadsStore((s) => s.records);
  const list = Object.values(records).sort((a, b) => b.savedAt - a.savedAt);

  if (list.length === 0) return <EmptyState>{t("empty")}</EmptyState>;

  const queue = list.map((record) => record.track);
  const totalSize = list.reduce((sum, record) => sum + record.size, 0);

  return (
    <section className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">{t("totalSize", { count: list.length, size: formatBytes(totalSize) })}</p>
      <ul className="flex flex-col">
        {list.map((record) => {
          const reciterName = getLocalizedReciterName(record.track.reciterName, locale);
          return (
            <li key={record.key}>
              <SurahRow
                track={record.track}
                queue={queue}
                context="other"
                subtitle={`${reciterName}, ${formatBytes(record.size)}`}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}
