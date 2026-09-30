"use client";

import { useLocale, useTranslations } from "next-intl";
import { EmptyState } from "@/components/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { getLocalizedReciterName } from "@/lib/bengali-data";
import { computeStreaks, distinctCompleted, lastDays, topReciters } from "@/lib/stats";
import { useHydrated } from "@/stores/hydration";
import { useStatsStore } from "@/stores/stats-store";
import { DataPanel } from "./data-panel";
import { WeekChart } from "./week-chart";

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl border bg-card p-4 sm:p-5">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold tracking-tight sm:text-3xl">{value}</p>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function StatsView() {
  const t = useTranslations("stats");
  const locale = useLocale();
  const hydrated = useHydrated();
  const stats = useStatsStore();

  if (!hydrated) {
    return (
      <div role="status" aria-label={t("title")} className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    const totalMinutes = Math.floor(seconds / 60);
    return totalMinutes >= 60
      ? t("hours", { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 })
      : t("mins", { minutes: totalMinutes });
  };

  const completedCount = distinctCompleted(stats.completed);
  const streaks = computeStreaks(stats.daily);
  const reciters = topReciters(stats.reciters);
  const topSeconds = reciters[0]?.seconds ?? 0;

  return (
    <div className="flex flex-col gap-8">
      {stats.totalSeconds === 0 && <EmptyState>{t("noData")}</EmptyState>}

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label={t("totalTime")} value={formatDuration(stats.totalSeconds)} />
        <StatTile
          label={t("completed")}
          value={String(completedCount)}
          hint={t("completedHint", { count: completedCount })}
        />
        <StatTile label={t("currentStreak")} value={t("days", { count: streaks.current })} hint={t("streakHint")} />
        <StatTile label={t("longestStreak")} value={t("days", { count: streaks.longest })} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section aria-labelledby="week-heading" className="flex flex-col gap-4 rounded-2xl border bg-card p-5 lg:col-span-3">
          <div>
            <h2 id="week-heading" className="text-lg font-semibold">
              {t("week")}
            </h2>
            <p className="text-sm text-muted-foreground">{t("weekDescription")}</p>
          </div>
          <WeekChart days={lastDays(stats.daily)} />
        </section>

        <section aria-labelledby="top-heading" className="flex flex-col gap-4 rounded-2xl border bg-card p-5 lg:col-span-2">
          <h2 id="top-heading" className="text-lg font-semibold">
            {t("topReciters")}
          </h2>
          {reciters.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("noData")}</p>
          ) : (
            <ol className="flex flex-col gap-4">
              {reciters.map((reciter) => (
                <li key={reciter.id} className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate font-medium">{getLocalizedReciterName(reciter.name, locale)}</span>
                    <span className="shrink-0 text-sm text-muted-foreground tabular-nums">{formatDuration(reciter.seconds)}</span>
                  </div>
                  <div className="h-1 overflow-hidden rounded-full bg-primary/15" aria-hidden>
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(reciter.seconds / topSeconds) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <DataPanel />
    </div>
  );
}
