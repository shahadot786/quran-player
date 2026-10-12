"use client";

import { CalendarCheckIcon } from "lucide-react";
import { useId, useMemo, useState, type FormEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useDuration } from "@/hooks/use-duration";
import { useKhatmPlan } from "@/hooks/use-khatm-plan";
import { useLocalizedNumber } from "@/hooks/use-localized-number";
import { dayFromKey, ramadanEnd } from "@/lib/calendar";
import { localDateKey } from "@/lib/format";
import { useProgressStore } from "@/stores/progress-store";

const QUICK_DAYS = 30;

export function useParas() {
  const locale = useLocale();
  return useMemo(() => new Intl.NumberFormat(locale, { maximumFractionDigits: 1, minimumFractionDigits: 0 }), [locale]);
}

export function KhatmPlan() {
  const t = useTranslations("progress.plan");
  const locale = useLocale();
  const n = useLocalizedNumber();
  const paras = useParas();
  const formatDuration = useDuration();
  const view = useKhatmPlan();
  const setPlan = useProgressStore((s) => s.setPlan);
  const [editing, setEditing] = useState(false);
  const formatDate = new Intl.DateTimeFormat(locale, { day: "numeric", month: "long", year: "numeric" });

  return (
    <section id="plan" aria-labelledby="plan-heading" className="flex scroll-mt-6 flex-col gap-4 rounded-2xl border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="plan-heading" className="text-lg font-semibold">
            {t("title")}
          </h2>
          {!view && <p className="max-w-prose text-sm text-muted-foreground">{t("description")}</p>}
        </div>
        <CalendarCheckIcon aria-hidden className="size-5 shrink-0 text-muted-foreground" />
      </div>

      {view && !editing && (
        <>
          {view.target.status === "on" && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                {t("finishBy", { date: formatDate.format(dayFromKey(view.finishBy)) })} · {t("daysLeft", { count: view.target.daysLeft })}
              </p>
              <p className="text-2xl font-semibold tracking-tight">{t("perDay", { paras: paras.format(view.target.parasPerDay) })}</p>
              <p className="text-sm text-muted-foreground">
                {view.target.secondsPerDay === null
                  ? t("ayahsPerDay", { ayahs: n(view.target.ayahsPerDay) })
                  : t("ayahsAndTime", { ayahs: n(view.target.ayahsPerDay), time: formatDuration(view.target.secondsPerDay) })}
              </p>
              {view.target.secondsPerDay !== null && (
                <div className="flex flex-col gap-1.5">
                  <p className="text-sm">{t("today", { done: formatDuration(view.secondsToday), goal: formatDuration(view.target.secondsPerDay) })}</p>
                  <Progress
                    value={Math.min(100, (view.secondsToday / view.target.secondsPerDay) * 100)}
                    aria-label={t("todayLabel")}
                    className="h-2 **:data-[slot=progress-indicator]:bg-gold"
                  />
                </div>
              )}
            </div>
          )}
          {view.target.status === "done" && <p className="font-medium">{t("done")}</p>}
          {view.target.status === "overdue" && <p className="text-sm">{t("overdue", { ayahs: n(view.target.ayahsLeft) })}</p>}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setEditing(true)}>
              {t("change")}
            </Button>
            <Button variant="ghost" onClick={() => setPlan(null)}>
              {t("remove")}
            </Button>
          </div>
        </>
      )}

      {(!view || editing) && (
        <PlanPicker
          initial={view?.finishBy}
          onPick={(day) => {
            setPlan(day);
            setEditing(false);
          }}
          onCancel={view ? () => setEditing(false) : undefined}
        />
      )}
    </section>
  );
}

function PlanPicker({ initial, onPick, onCancel }: { initial?: string; onPick: (day: string) => void; onCancel?: () => void }) {
  const t = useTranslations("progress.plan");
  const locale = useLocale();
  const id = useId();
  const today = localDateKey();
  const [value, setValue] = useState(initial ?? "");
  const ramadan = useMemo(() => ramadanEnd(new Date()), []);
  const shortDate = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (value >= today) onPick(value);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => {
            const now = new Date();
            onPick(localDateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() + QUICK_DAYS - 1)));
          }}
        >
          {t("inDays")}
        </Button>
        {ramadan && (
          <Button variant="outline" onClick={() => onPick(ramadan)}>
            {t("byRamadan", { date: shortDate.format(dayFromKey(ramadan)) })}
          </Button>
        )}
      </div>
      <form onSubmit={submit} className="flex flex-wrap items-end gap-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor={id}>{t("pick")}</Label>
          <Input id={id} type="date" min={today} value={value} onChange={(event) => setValue(event.target.value)} className="w-auto" />
        </div>
        <Button type="submit" disabled={!value || value < today}>
          {t("set")}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel}>
            {t("cancel")}
          </Button>
        )}
      </form>
    </div>
  );
}
