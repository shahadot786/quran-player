"use client";

import { useLocale, useTranslations } from "next-intl";
import { YearHeatmap } from "@/components/calendar/year-heatmap";
import { useDuration } from "@/hooks/use-duration";
import { getLocalizedReciterName, getLocalizedSurahName } from "@/lib/bengali-data";
import { getSurah } from "@/lib/surahs";
import { useSessionStore } from "@/stores/session-store";
import { useStatsStore } from "@/stores/stats-store";

export function ListeningCalendar() {
  const t = useTranslations("stats.calendar");
  const tCalendar = useTranslations("calendar");
  const locale = useLocale();
  const formatDuration = useDuration();
  const daily = useStatsStore((s) => s.daily);
  const sessions = useSessionStore((s) => s.sessions);
  const time = new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit" });

  return (
    <YearHeatmap
      title={t("title")}
      description={t("description")}
      values={daily}
      describe={(seconds) => (seconds > 0 ? formatDuration(seconds) : tCalendar("nothing"))}
      renderDay={(day) => {
        const total = daily[day] ?? 0;
        const onDay = sessions.filter((session) => session.day === day).sort((a, b) => a.startedAt - b.startedAt);
        if (total === 0 && onDay.length === 0) return <p className="text-sm text-muted-foreground">{t("none")}</p>;
        return (
          <>
            <p className="text-2xl font-semibold tabular-nums">{formatDuration(total)}</p>
            {onDay.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("onlyTotal")}</p>
            ) : (
              <section aria-labelledby="day-sessions-heading" className="flex flex-col gap-2">
                <h3 id="day-sessions-heading" className="text-sm font-medium text-muted-foreground">
                  {t("sessions")}
                </h3>
                <ul className="flex flex-col gap-2">
                  {onDay.map((session) => (
                    <li key={session.id} className="flex items-center justify-between gap-3 rounded-xl border p-3">
                      <div className="flex min-w-0 flex-col">
                        <span className="truncate font-medium">{getLocalizedSurahName(getSurah(session.surah), locale)}</span>
                        <span className="truncate text-sm text-muted-foreground">
                          {getLocalizedReciterName(session.reciterName, locale)} · {time.format(session.startedAt)}
                        </span>
                      </div>
                      <span className="shrink-0 text-sm tabular-nums">{formatDuration(session.seconds)}</span>
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
