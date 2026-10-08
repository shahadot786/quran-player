"use client";

import { useTranslations } from "next-intl";
import { StatTile } from "@/components/stat-tile";
import { Progress } from "@/components/ui/progress";
import { useDuration } from "@/hooks/use-duration";
import { useLocalizedNumber } from "@/hooks/use-localized-number";
import type { ProgressModel } from "@/lib/progress/model";
import { formatPercent } from "@/lib/progress/percent";
import { averageSecondsPerActiveDay } from "@/lib/stats";
import { useProgressStore } from "@/stores/progress-store";
import { useStatsStore } from "@/stores/stats-store";

export function Overview({ model }: { model: ProgressModel }) {
  const t = useTranslations("progress.overview");
  const n = useLocalizedNumber();
  const duration = useDuration();
  const totalSeconds = useStatsStore((s) => s.totalSeconds);
  const daily = useStatsStore((s) => s.daily);
  const currentRound = useProgressStore((s) => s.currentRound);
  const rounds = useProgressStore((s) => s.rounds.length);
  const { overall, pace } = model;
  const percent = formatPercent(overall.percent);

  return (
    <section aria-label={t("label")} className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 rounded-2xl border bg-card p-5 sm:p-6">
        <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="text-5xl font-semibold tracking-tight">{n(percent)}%</span>
          <span className="text-muted-foreground">{t("heard")}</span>
        </p>
        <Progress value={overall.percent * 100} aria-label={`${n(percent)}% ${t("heard")}`} className="h-2 **:data-[slot=progress-indicator]:bg-gold" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatTile label={t("surahs")} value={t("surahsValue", { done: n(overall.surahsFinished) })} hint={t("thisRound")} />
        <StatTile label={t("paras")} value={t("parasValue", { done: n(overall.parasFinished) })} hint={t("thisRound")} />
        <StatTile label={t("ayahs")} value={t("ayahsValue", { heard: n(overall.ayahsHeard), total: n(overall.ayahsTotal) })} />
        <StatTile label={t("round")} value={t("roundValue", { number: n(currentRound) })} hint={t("roundHint", { count: rounds })} />
        <StatTile label={t("time")} value={duration(totalSeconds)} />
        <StatTile label={t("average")} value={duration(averageSecondsPerActiveDay(daily))} hint={t("averageHint")} />
        <StatTile
          label={t("timeLeft")}
          value={pace ? duration(pace.secondsLeft) : "–"}
          hint={pace ? t("timeLeftHint") : t("timeLeftNone")}
        />
      </div>
    </section>
  );
}
