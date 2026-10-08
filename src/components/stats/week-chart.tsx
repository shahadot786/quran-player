"use client";

import { useFormatter } from "next-intl";
import { axisTop } from "@/lib/chart";
import { localDateKey } from "@/lib/format";
import { cn } from "@/lib/utils";

type Props = {
  days: { date: Date; value: number }[];
  /** Round values the axis can top out at, smallest first. */
  steps: readonly number[];
  /** Size of the jumps once the biggest bar is past the last step. */
  fallbackStep: number;
  /** Describes a value in words, for the tooltip and the accessible name of each bar. */
  describe: (value: number) => string;
  formatNumber?: (value: number) => string;
};

// A seven-bar chart of one value per day, in the unit the caller chooses.
export function WeekChart({ days, steps, fallbackStep, describe, formatNumber = String }: Props) {
  const format = useFormatter();
  const values = days.map((day) => day.value);
  const top = axisTop(Math.max(...values), steps, fallbackStep);
  const todayKey = localDateKey();

  return (
    <div className="flex gap-3">
      <div className="flex h-44 w-8 flex-col justify-between pb-px text-right text-xs text-muted-foreground tabular-nums" aria-hidden>
        <span>{formatNumber(top)}</span>
        <span>{formatNumber(top / 2)}</span>
        <span>{formatNumber(0)}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className="relative h-44">
          <div className="absolute inset-x-0 top-0 border-t" aria-hidden />
          <div className="absolute inset-x-0 top-1/2 border-t" aria-hidden />
          <ul className="absolute inset-0 flex border-b">
            {days.map((day, i) => {
              const label = `${format.dateTime(day.date, { weekday: "long" })}, ${describe(values[i]!)}`;
              const height = `${(values[i]! / top) * 100}%`;
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
                    <strong className="block font-semibold">{describe(values[i]!)}</strong>
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
