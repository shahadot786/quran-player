"use client";

import { useLocale, useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLocalizedNumber } from "@/hooks/use-localized-number";
import { getLocalizedSurahName } from "@/lib/bengali-data";
import type { ParaProgress } from "@/lib/progress/calc";
import { formatPercent } from "@/lib/progress/percent";
import { getSurah } from "@/lib/surahs";
import { cn } from "@/lib/utils";

export function ParaGrid({ paras }: { paras: ParaProgress[] }) {
  const t = useTranslations("progress.paras");
  const locale = useLocale();
  const n = useLocalizedNumber();

  return (
    <ul className="grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-3">
      {paras.map((para) => {
        const percent = formatPercent(para.percent);
        const names = para.surahs.map((id) => getLocalizedSurahName(getSurah(id), locale)).join(", ");
        return (
          <li key={para.juz} className={cn("flex flex-col gap-3 rounded-2xl border bg-card p-4", para.finished && "border-primary/40")}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-semibold">{t("para", { number: n(para.juz) })}</h2>
              <div className="flex items-center gap-1.5">
                {para.finished && <Badge>{t("finished")}</Badge>}
                {!para.exact && !para.finished && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" tabIndex={0} aria-label={`${t("estimated")}. ${t("estimatedHint")}`}>
                        {t("estimated")}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-64">{t("estimatedHint")}</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Progress
                value={para.percent * 100}
                aria-label={t("heard", { percent: `${n(percent)}%` })}
                className={cn("h-2 flex-1", !para.finished && "**:data-[slot=progress-indicator]:bg-gold")}
              />
              <span className="w-12 text-right text-sm text-muted-foreground tabular-nums">{n(percent)}%</span>
            </div>
            <p className="line-clamp-2 text-xs text-muted-foreground">{names}</p>
          </li>
        );
      })}
    </ul>
  );
}
