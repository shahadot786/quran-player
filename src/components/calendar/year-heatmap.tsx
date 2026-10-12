"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useLocalizedNumber } from "@/hooks/use-localized-number";
import { activeDays, dayFromKey, hijriParts, levelFor, monthColumns, yearMax, yearWeeks, yearsWithData, type Level } from "@/lib/calendar";
import { localDateKey } from "@/lib/format";
import { cn } from "@/lib/utils";

const LEVEL_CLASS: Record<Level, string> = {
  0: "bg-muted",
  1: "bg-primary/25",
  2: "bg-primary/50",
  3: "bg-primary/75",
  4: "bg-primary",
};
// Monday, Wednesday and Friday are labelled, as on most year grids, so the rows stay readable without crowding.
const LABELLED_ROWS = [0, 2, 4];

type Props = {
  title: string;
  description: string;
  /** Totals per day key; the shade of each cell comes from these. */
  values: Record<string, number>;
  /** How a day's total reads, for cell labels and the day sheet. */
  describe: (value: number) => string;
  /** The body of the day sheet. */
  renderDay: (key: string) => ReactNode;
};

export function YearHeatmap({ title, description, values, describe, renderDay }: Props) {
  const t = useTranslations("calendar");
  const locale = useLocale();
  const n = useLocalizedNumber();
  const today = localDateKey(new Date());
  const currentYear = Number(today.slice(0, 4));
  const years = useMemo(() => yearsWithData(Object.keys(values), currentYear), [values, currentYear]);
  const [year, setYear] = useState(currentYear);
  const [focused, setFocused] = useState(today);
  const [open, setOpen] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const cells = useRef(new Map<string, HTMLButtonElement>());

  const weeks = useMemo(() => yearWeeks(year), [year]);
  const months = useMemo(() => monthColumns(weeks), [weeks]);
  const max = yearMax(values, year);
  const formatDate = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" });
  const monthName = new Intl.DateTimeFormat(locale, { month: "short" });
  const weekdayName = new Intl.DateTimeFormat(locale, { weekday: "short" });
  const headingId = `${title.replace(/\W+/g, "-").toLowerCase()}-heading`;

  // On a narrow screen the grid scrolls sideways; the current year opens at today, not at January.
  useEffect(() => {
    const element = scroller.current;
    if (element) element.scrollLeft = year === currentYear ? element.scrollWidth : 0;
  }, [year, currentYear]);

  const changeYear = (next: number) => {
    setYear(next);
    setFocused(next === currentYear ? today : `${next}-01-01`);
  };

  // Arrow keys move one day up or down and one week left or right, like the grid looks.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const steps: Record<string, number> = { ArrowUp: -1, ArrowDown: 1, ArrowLeft: -7, ArrowRight: 7 };
    const step = steps[event.key];
    if (step === undefined) return;
    event.preventDefault();
    const current = dayFromKey(focused);
    const next = localDateKey(new Date(current.getFullYear(), current.getMonth(), current.getDate() + step));
    if (!next.startsWith(`${year}-`)) return;
    setFocused(next);
    cells.current.get(next)?.focus();
  };

  const hijri = (key: string) => t("hijri", hijriParts(dayFromKey(key), locale));
  const openDate = open ? dayFromKey(open) : null;
  const yearIndex = years.indexOf(year);

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id={headingId} className="text-lg font-semibold">
            {title}
          </h2>
          <p className="max-w-prose text-sm text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("previousYear")}
            disabled={yearIndex === years.length - 1}
            onClick={() => changeYear(years[yearIndex + 1]!)}
          >
            <ChevronLeftIcon className="rtl:rotate-180" />
          </Button>
          <span className="min-w-12 text-center font-medium tabular-nums" aria-live="polite">
            {n(year)}
          </span>
          <Button variant="ghost" size="icon" aria-label={t("nextYear")} disabled={yearIndex <= 0} onClick={() => changeYear(years[yearIndex - 1]!)}>
            <ChevronRightIcon className="rtl:rotate-180" />
          </Button>
        </div>
      </div>

      <p className="text-sm">
        <span className="font-semibold">{t("activeDays", { count: activeDays(values, year), year: n(year) })}</span>
        <span className="text-muted-foreground"> · {t("totalDays", { count: activeDays(values) })}</span>
      </p>

      <div ref={scroller} className="overflow-x-auto pb-1">
        <div
          role="group"
          aria-label={t("gridLabel", { year: n(year) })}
          onKeyDown={onKeyDown}
          className="inline-grid w-max gap-1"
          style={{ gridTemplateColumns: `auto repeat(${weeks.length}, max-content)`, gridTemplateRows: "auto repeat(7, max-content)" }}
        >
          <span aria-hidden className="sticky left-0 z-10 bg-card" />
          {weeks.map((_, column) => {
            const month = months.find((entry) => entry.column === column);
            return (
              <span key={column} aria-hidden className="h-4 w-3 overflow-visible text-xs whitespace-nowrap text-muted-foreground">
                {month ? monthName.format(new Date(year, month.month, 1)) : ""}
              </span>
            );
          })}
          {Array.from({ length: 7 }, (_, row) => (
            <div key={row} className="contents">
              <span aria-hidden className="sticky left-0 z-10 bg-card pr-1 text-xs leading-3 text-muted-foreground">
                {LABELLED_ROWS.includes(row) ? weekdayName.format(new Date(2024, 0, 1 + row)) : ""}
              </span>
              {weeks.map((week, column) => {
                const cell = week[row];
                if (!cell) return <span key={column} aria-hidden className="size-3" />;
                const value = values[cell.key] ?? 0;
                return (
                  <button
                      key={column}
                      ref={(element) => {
                        if (element) cells.current.set(cell.key, element);
                        else cells.current.delete(cell.key);
                      }}
                      type="button"
                      tabIndex={cell.key === focused ? 0 : -1}
                      aria-label={`${formatDate.format(cell.date)}: ${describe(value)}`}
                      onFocus={() => setFocused(cell.key)}
                      onClick={() => setOpen(cell.key)}
                      className={cn(
                        "block size-3 rounded-xs outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        LEVEL_CLASS[levelFor(value, max)],
                        cell.key === today && "ring-1 ring-foreground/50",
                      )}
                    />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-end gap-1 text-xs text-muted-foreground" aria-hidden>
        <span className="pr-1">{t("less")}</span>
        {([0, 1, 2, 3, 4] as const).map((level) => (
          <span key={level} className={cn("size-3 rounded-xs", LEVEL_CLASS[level])} />
        ))}
        <span className="pl-1">{t("more")}</span>
      </div>

      <Sheet open={open !== null} onOpenChange={(next) => !next && setOpen(null)}>
        <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-md">
          {open && openDate && (
            <>
              <SheetHeader className="border-b">
                <SheetTitle>{new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(openDate)}</SheetTitle>
                <SheetDescription>{hijri(open)}</SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-4 p-4">{renderDay(open)}</div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </section>
  );
}
