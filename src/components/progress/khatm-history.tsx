"use client";

import { useFormatter, useTranslations } from "next-intl";
import { EmptyState } from "@/components/empty-state";
import { useDuration } from "@/hooks/use-duration";
import { useLocalizedNumber } from "@/hooks/use-localized-number";
import { khatmDays } from "@/lib/progress/model";
import { useProgressStore } from "@/stores/progress-store";

export function KhatmHistory() {
  const t = useTranslations("progress.khatm");
  const format = useFormatter();
  const n = useLocalizedNumber();
  const duration = useDuration();
  const rounds = useProgressStore((s) => s.rounds);

  if (rounds.length === 0) return <EmptyState>{t("empty")}</EmptyState>;

  return (
    <ol className="flex flex-col gap-3">
      {[...rounds].reverse().map((round) => (
        <li key={round.number} className="flex flex-col gap-1 rounded-2xl border bg-card p-4">
          <h2 className="font-semibold">{t("number", { number: n(round.number) })}</h2>
          <p className="text-sm text-muted-foreground">
            {t("finished", { date: format.dateTime(round.finishedAt, { dateStyle: "long" }) })} · {t("took", { days: khatmDays(round) })}
          </p>
          <p className="text-sm text-muted-foreground">{round.seconds > 0 ? t("listened", { duration: duration(round.seconds) }) : t("unknownListening")}</p>
        </li>
      ))}
    </ol>
  );
}
