"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useLocalizedNumber } from "@/hooks/use-localized-number";
import { useProgressModel } from "@/hooks/use-progress-model";
import { formatPercent } from "@/lib/progress/percent";
import { cn } from "@/lib/utils";

// 114 surahs split into three even rows keeps the strip tidy at any width.
const STRIP_COLUMNS = 38;

export function ProgressCard() {
  const t = useTranslations("progress.card");
  const n = useLocalizedNumber();
  const { overall, surahs } = useProgressModel();
  const started = overall.surahsStarted > 0;

  return (
    <section aria-labelledby="progress-card-heading" className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="progress-card-heading" className="font-semibold">
          {t("title")}
        </h2>
        <span className="text-2xl font-semibold tabular-nums">{n(formatPercent(overall.percent))}%</span>
      </div>

      {started ? (
        <>
          <p className="text-sm text-muted-foreground">{t("summary", { paras: n(overall.parasFinished), surahs: n(overall.surahsFinished) })}</p>
          <div role="img" aria-label={t("strip")} className="grid gap-0.5" style={{ gridTemplateColumns: `repeat(${STRIP_COLUMNS}, minmax(0, 1fr))` }}>
            {surahs.map((cell) => (
              <span
                key={cell.id}
                className={cn("aspect-square rounded-xs", cell.state === "finished" ? "bg-primary" : cell.state === "in-progress" ? "bg-gold" : "bg-muted")}
              />
            ))}
          </div>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      )}

      <Button asChild variant="outline">
        <Link href="/progress">{t("view")}</Link>
      </Button>
    </section>
  );
}
