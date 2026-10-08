"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { EmptyState } from "@/components/empty-state";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocalizedNumber } from "@/hooks/use-localized-number";
import { getLocalizedSurahName } from "@/lib/bengali-data";
import type { SurahState } from "@/lib/progress/calc";
import type { SurahCell } from "@/lib/progress/model";
import { formatPercent } from "@/lib/progress/percent";
import { getSurah } from "@/lib/surahs";
import { cn } from "@/lib/utils";

type Filter = "all" | SurahState;

const FILTER_KEYS: Record<Filter, "all" | "inProgress" | "finished" | "notStarted"> = {
  all: "all",
  "in-progress": "inProgress",
  finished: "finished",
  "not-started": "notStarted",
};

const STATE_KEYS: Record<SurahState, "notStarted" | "inProgress" | "finished"> = {
  "not-started": "notStarted",
  "in-progress": "inProgress",
  finished: "finished",
};

export function SurahGrid({ cells, onSelect }: { cells: SurahCell[]; onSelect: (id: number) => void }) {
  const t = useTranslations("progress");
  const locale = useLocale();
  const n = useLocalizedNumber();
  const [filter, setFilter] = useState<Filter>("all");
  const count = (state: Filter) => (state === "all" ? cells.length : cells.filter((cell) => cell.state === state).length);
  const visible = cells.filter((cell) => filter === "all" || cell.state === filter);

  return (
    <div className="flex flex-col gap-4">
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
          <TabsList aria-label={t("surahs.filter")} className="w-max">
            {(Object.keys(FILTER_KEYS) as Filter[]).map((key) => (
              <TabsTrigger key={key} value={key}>
                {t(`surahs.filters.${FILTER_KEYS[key]}`)} ({n(count(key))})
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {visible.length === 0 ? (
        <EmptyState>{t("surahs.none")}</EmptyState>
      ) : (
        <ul className="grid grid-cols-5 gap-2 sm:grid-cols-8 lg:grid-cols-10 xl:grid-cols-12">
          {visible.map((cell) => {
            const surah = getSurah(cell.id);
            const name = getLocalizedSurahName(surah, locale);
            const label =
              cell.state === "in-progress"
                ? t("surahs.cellHeard", { number: n(cell.id), name, percent: `${n(formatPercent(cell.coverage))}%` })
                : t("surahs.cell", { number: n(cell.id), name, status: t(`states.${STATE_KEYS[cell.state]}`) });
            const fill = Math.round(cell.coverage * 100);
            return (
              <li key={cell.id}>
                <button
                  type="button"
                  onClick={() => onSelect(cell.id)}
                  aria-label={label}
                  title={name}
                  style={
                    cell.state === "in-progress"
                      ? { backgroundImage: `linear-gradient(to top, color-mix(in oklab, var(--gold) 55%, transparent) ${fill}%, transparent ${fill}%)` }
                      : undefined
                  }
                  className={cn(
                    "flex aspect-square w-full items-center justify-center rounded-lg border text-sm font-medium tabular-nums transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    cell.state === "finished" && "border-primary bg-primary text-primary-foreground",
                    cell.state === "in-progress" && "border-gold/60 bg-muted/40",
                    cell.state === "not-started" && "bg-muted/40 text-muted-foreground hover:bg-accent",
                  )}
                >
                  {n(cell.id)}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
