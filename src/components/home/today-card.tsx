"use client";

import { CloudIcon, XIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useLocale, useNow, useTranslations } from "next-intl";
import { useParas } from "@/components/progress/khatm-plan";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useDuration } from "@/hooks/use-duration";
import { useKhatmPlan } from "@/hooks/use-khatm-plan";
import { useLocalizedNumber } from "@/hooks/use-localized-number";
import { useProgressModel } from "@/hooks/use-progress-model";
import { activeDays, hijriParts } from "@/lib/calendar";
import { localDateKey } from "@/lib/format";
import { formatPercent } from "@/lib/progress/percent";
import { computeStreaks } from "@/lib/stats";
import { syncNudge } from "@/lib/sync/nudge";
import { dayTotal } from "@/lib/zikir/stats";
import { useHydrated } from "@/stores/hydration";
import { useStatsStore } from "@/stores/stats-store";
import { useSyncStore } from "@/stores/sync-store";
import { useZikirStore } from "@/stores/zikir-store";

function Figure({ href, label, value, hint }: { href: string; label: string; value: string; hint?: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-0.5 rounded-xl p-3 outline-none transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-xl font-semibold tracking-tight tabular-nums">{value}</span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </Link>
  );
}

export function TodayCard({ children }: { children?: ReactNode }) {
  const t = useTranslations("home.today");
  const tCalendar = useTranslations("calendar");
  const tStats = useTranslations("stats");
  const locale = useLocale();
  const hydrated = useHydrated();
  const n = useLocalizedNumber();
  const paras = useParas();
  const formatDuration = useDuration();
  const now = useNow({ updateInterval: 60_000 });
  const model = useProgressModel();
  const plan = useKhatmPlan();
  const daily = useStatsStore((s) => s.daily);
  const counts = useZikirStore((s) => s.counts);
  const lastSyncedAt = useSyncStore((s) => s.lastSyncedAt);
  const dismissedAt = useSyncStore((s) => s.nudgeDismissedAt);
  const dismissNudge = useSyncStore((s) => s.dismissNudge);

  if (!hydrated) return <Skeleton className="h-56 rounded-2xl" />;

  const today = localDateKey(now);
  const streak = computeStreaks(daily, now).current;
  const nudge = syncNudge({ now: now.getTime(), lastSyncedAt, dismissedAt, activeDays: activeDays(daily) });

  return (
    <section aria-labelledby="today-heading" className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
      <div className="flex flex-col gap-0.5">
        <h2 id="today-heading" className="text-lg font-semibold">
          {new Intl.DateTimeFormat(locale, { weekday: "long", day: "numeric", month: "long" }).format(now)}
        </h2>
        <p className="text-sm text-muted-foreground">{tCalendar("hijri", hijriParts(now, locale))}</p>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-sm text-muted-foreground">{t("quran")}</span>
          <span className="text-sm tabular-nums">{t("surahs", { done: n(model.overall.surahsFinished) })}</span>
        </div>
        <Progress
          value={model.overall.percent * 100}
          aria-label={t("quranLabel", { percent: n(formatPercent(model.overall.percent)) })}
          className="h-2 **:data-[slot=progress-indicator]:bg-gold"
        />
      </div>

      <div className="-mx-3 grid grid-cols-2 sm:grid-cols-4">
        <Figure href="/progress" label={t("heard")} value={`${n(formatPercent(model.overall.percent))}%`} />
        <Figure href="/stats" label={t("listenedToday")} value={formatDuration(daily[today] ?? 0)} />
        <Figure href="/stats" label={t("streak")} value={tStats("days", { count: streak })} />
        <Figure href="/zikir" label={t("zikirToday")} value={n(dayTotal(counts, today))} />
      </div>

      <p className="text-sm">
        {plan?.target.status === "on" ? (
          <Link href="/progress#plan" className="underline-offset-4 hover:underline">
            {plan.target.secondsPerDay === null
              ? t("planParas", { paras: paras.format(plan.target.parasPerDay), days: n(plan.target.daysLeft) })
              : t("planTime", { paras: paras.format(plan.target.parasPerDay), time: formatDuration(plan.target.secondsPerDay), days: n(plan.target.daysLeft) })}
          </Link>
        ) : (
          <Link href="/progress#plan" className="text-muted-foreground underline-offset-4 hover:underline">
            {plan ? t("planReview") : t("planStart")}
          </Link>
        )}
      </p>

      {nudge && (
        <div className="flex items-center gap-3 rounded-xl bg-muted p-3 text-sm">
          <CloudIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
          <p className="flex-1">{nudge.kind === "never" ? t("syncNever") : t("syncStale", { count: nudge.days })}</p>
          <Button asChild size="sm" variant="outline">
            <Link href="/stats#sync">{t("syncNow")}</Link>
          </Button>
          <Button size="icon-sm" variant="ghost" aria-label={t("syncDismiss")} onClick={() => dismissNudge()}>
            <XIcon />
          </Button>
        </div>
      )}

      {children}
    </section>
  );
}
