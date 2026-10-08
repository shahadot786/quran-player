"use client";

import { useTranslations } from "next-intl";
import { EmptyState } from "@/components/empty-state";
import { StatTile } from "@/components/stat-tile";
import { WeekChart } from "@/components/stats/week-chart";
import { useLocalizedNumber } from "@/hooks/use-localized-number";
import { activeGoals, dayTotal, lastDaysTotals, lifetimeTotals, zikirStreaks } from "@/lib/zikir/stats";
import { localDateKey } from "@/lib/format";
import { useZikirStore } from "@/stores/zikir-store";
import { useZikirText } from "./use-zikir-text";

const COUNT_STEPS = [10, 20, 50, 100, 200, 500, 1000, 2000, 5000];
const COUNT_FALLBACK_STEP = 1000;
const TOP_ITEMS = 5;

export function ZikirStats() {
  const t = useTranslations("zikir");
  const n = useLocalizedNumber();
  const text = useZikirText();
  const counts = useZikirStore((s) => s.counts);
  const history = useZikirStore((s) => s.history);
  const items = useZikirStore((s) => s.items);
  const groups = useZikirStore((s) => s.groups);

  const lifetime = lifetimeTotals(counts);
  if (lifetime.total === 0) return <EmptyState>{t("stats.empty")}</EmptyState>;

  const streaks = zikirStreaks(activeGoals({ items, groups }), counts, history);
  const top = Object.entries(lifetime.byItem)
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_ITEMS);
  const topValue = top[0]?.[1] ?? 1;

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label={t("today")} value={n(dayTotal(counts, localDateKey()))} />
        <StatTile label={t("stats.lifetime")} value={n(lifetime.total)} />
        <StatTile label={t("stats.currentStreak")} value={t("stats.days", { count: streaks.current })} hint={t("stats.streakHint")} />
        <StatTile label={t("stats.longestStreak")} value={t("stats.days", { count: streaks.longest })} />
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <section aria-labelledby="zikir-week-heading" className="flex flex-col gap-4 rounded-2xl border bg-card p-5 lg:col-span-3">
          <div>
            <h2 id="zikir-week-heading" className="text-lg font-semibold">
              {t("stats.week")}
            </h2>
            <p className="text-sm text-muted-foreground">{t("stats.weekDescription")}</p>
          </div>
          <WeekChart
            days={lastDaysTotals(counts).map(({ date, total }) => ({ date, value: total }))}
            steps={COUNT_STEPS}
            fallbackStep={COUNT_FALLBACK_STEP}
            describe={(count) => t("stats.counts", { count: count })}
            formatNumber={n}
          />
        </section>

        <section aria-labelledby="zikir-top-heading" className="flex flex-col gap-4 rounded-2xl border bg-card p-5 lg:col-span-2">
          <h2 id="zikir-top-heading" className="text-lg font-semibold">
            {t("stats.top")}
          </h2>
          <ol className="flex flex-col gap-4">
            {top.map(([itemId, total]) => (
              <li key={itemId} className="flex flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate font-medium">{text.itemView(itemId)?.name ?? t("stats.removed")}</span>
                  <span className="shrink-0 text-sm text-muted-foreground tabular-nums">{n(total)}</span>
                </div>
                <div className="h-1 overflow-hidden rounded-full bg-primary/15" aria-hidden>
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(total / topValue) * 100}%` }} />
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
