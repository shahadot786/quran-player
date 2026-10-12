"use client";

import { useMemo } from "react";
import { useLocale, useTranslations } from "next-intl";
import { YearHeatmap } from "@/components/calendar/year-heatmap";
import { Badge } from "@/components/ui/badge";
import { dayBreakdown, dayTotals, roundsOnDay } from "@/lib/zikir/stats";
import { useZikirStore } from "@/stores/zikir-store";
import { useZikirText } from "./use-zikir-text";

export function ZikirCalendar() {
  const t = useTranslations("zikir");
  const tCalendar = useTranslations("calendar");
  const locale = useLocale();
  const text = useZikirText();
  const counts = useZikirStore((s) => s.counts);
  const history = useZikirStore((s) => s.history);
  const totals = useMemo(() => dayTotals(counts), [counts]);
  const time = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" });

  const roundName = (entry: (typeof history)[number]) =>
    entry.name ?? (entry.kind === "item" ? text.itemView(entry.refId)?.name : text.groupView(entry.refId)?.name) ?? t("stats.removed");

  return (
    <YearHeatmap
      title={t("calendar.title")}
      description={t("calendar.description")}
      values={totals}
      describe={(count) => (count > 0 ? t("stats.counts", { count }) : tCalendar("nothing"))}
      renderDay={(day) => {
        const items = dayBreakdown(counts, day);
        const rounds = roundsOnDay(history, day);
        if (items.length === 0 && rounds.length === 0) return <p className="text-sm text-muted-foreground">{t("calendar.none")}</p>;
        return (
          <>
            <p className="text-2xl font-semibold">{t("stats.counts", { count: totals[day] ?? 0 })}</p>
            {items.length > 0 && (
              <ul className="flex flex-col gap-2">
                {items.map(({ itemId, count }) => (
                  <li key={itemId} className="flex items-center justify-between gap-3 rounded-xl border p-3">
                    <span className="truncate font-medium">{text.itemView(itemId)?.name ?? t("stats.removed")}</span>
                    <span className="shrink-0 text-sm">{t("stats.counts", { count })}</span>
                  </li>
                ))}
              </ul>
            )}
            {rounds.length > 0 && (
              <section aria-labelledby="day-rounds-heading" className="flex flex-col gap-2">
                <h3 id="day-rounds-heading" className="text-sm font-medium text-muted-foreground">
                  {t("calendar.rounds")}
                </h3>
                <ul className="flex flex-col gap-2">
                  {rounds.map((entry) => (
                    <li key={entry.id} className="flex items-center justify-between gap-3 rounded-xl border p-3">
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-medium">{roundName(entry)}</span>
                        <span className="text-sm text-muted-foreground">{time.format(entry.finishedAt)}</span>
                      </div>
                      {!entry.completed && <Badge variant="secondary">{t("history.early")}</Badge>}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </>
        );
      }}
    />
  );
}
