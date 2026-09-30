"use client";

import { useFormatter, useTranslations } from "next-intl";
import { localDateKey } from "@/lib/format";
import { cn } from "@/lib/utils";

const MINUTE_STEPS = [5, 10, 15, 30, 60, 120, 240, 480];

function axisTop(maxMinutes: number) {
  return MINUTE_STEPS.find((step) => step >= maxMinutes) ?? Math.ceil(maxMinutes / 60) * 60;
}

export function WeekChart({ days }: { days: { date: Date; seconds: number }[] }) {
  const t = useTranslations("stats");
  const format = useFormatter();
  const minutes = days.map((day) => Math.round(day.seconds / 60));
  const top = axisTop(Math.max(...minutes));
  const todayKey = localDateKey();

  return (
    <div className="flex gap-3">
      <div className="flex h-44 w-8 flex-col justify-between pb-px text-right text-xs text-muted-foreground tabular-nums" aria-hidden>
        <span>{top}</span>
        <span>{top / 2}</span>
        <span>0</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="relative h-44">
          <div className="absolute inset-x-0 top-0 border-t" aria-hidden />
          <div className="absolute inset-x-0 top-1/2 border-t" aria-hidden />
          <ul className="absolute inset-0 flex border-b">
            {days.map((day, i) => {
              const label = `${format.dateTime(day.date, { weekday: "long" })}, ${t("minutes", { count: minutes[i]! })}`;
              const height = `${(minutes[i]! / top) * 100}%`;
              return (
                <li
                  key={localDateKey(day.date)}
                  role="img"
                  aria-label={label}
                  tabIndex={0}
                  className="group relative flex flex-1 items-end justify-center rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <span className="w-full max-w-6 rounded-t-sm bg-primary transition-opacity group-hover:opacity-80 group-focus-visible:opacity-80" style={{ height }} />
                  <span
                    aria-hidden
                    style={{ bottom: height }}
                    className="pointer-events-none absolute z-10 mb-2 hidden rounded-md border bg-popover px-2 py-1 text-center text-xs whitespace-nowrap text-popover-foreground shadow-md group-hover:block group-focus-visible:block"
                  >
                    <strong className="block font-semibold">{t("minutes", { count: minutes[i]! })}</strong>
                    <span className="text-muted-foreground">{format.dateTime(day.date, { weekday: "short", day: "numeric", month: "short" })}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="mt-2 flex" aria-hidden>
          {days.map((day) => (
            <span
              key={localDateKey(day.date)}
              className={cn("flex-1 text-center text-xs text-muted-foreground", localDateKey(day.date) === todayKey && "font-semibold text-foreground")}
            >
              {format.dateTime(day.date, { weekday: "short" })}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
