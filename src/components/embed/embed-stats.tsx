"use client";

import { useLocale, useTranslations } from "next-intl";
import { toBengaliDigits } from "@/lib/bengali-data";
import { embedStats } from "@/lib/embed/stats";
import { useStatsStore } from "@/stores/stats-store";

export function EmbedStats() {
  const t = useTranslations("embed");
  const locale = useLocale();
  const daily = useStatsStore((s) => s.daily);
  const completed = useStatsStore((s) => s.completed);
  const { minutes, streak, finished } = embedStats(daily, completed);
  const digits = (n: number) => (locale === "bn" ? toBengaliDigits(n) : String(n));
  const tiles = [
    { label: t("statsToday"), value: t("minutes", { count: digits(minutes) }) },
    { label: t("statsStreak"), value: t("days", { count: locale === "bn" ? digits(streak) : streak }) },
    { label: t("statsFinished"), value: t("surahCount", { count: locale === "bn" ? digits(finished) : finished }) },
  ];

  return (
    <section aria-label={t("statsTitle")} className="flex flex-col gap-2">
      <dl className="grid grid-cols-3 gap-2">
        {tiles.map(({ label, value }) => (
          <div key={label} className="flex flex-col gap-0.5 rounded-xl border bg-card px-3 py-2.5 shadow-sm">
            <dt className="truncate text-xs text-muted-foreground">{label}</dt>
            <dd className="truncate text-sm font-bold">{value}</dd>
          </div>
        ))}
      </dl>
      {minutes === 0 && finished === 0 && streak === 0 && <p className="px-1 text-xs text-muted-foreground">{t("statsEmpty")}</p>}
    </section>
  );
}
