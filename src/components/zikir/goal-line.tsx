"use client";

import { CheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Progress } from "@/components/ui/progress";
import { useLocalizedNumber } from "@/hooks/use-localized-number";
import { localDateKey } from "@/lib/format";
import { dayGoalProgress } from "@/lib/zikir/stats";
import type { RunKind } from "@/lib/zikir/types";
import { useZikirStore } from "@/stores/zikir-store";

// Today's progress toward a daily goal: counts for a zikir, finished rounds for a group.
export function GoalLine({ kind, id, goal }: { kind: RunKind; id: string; goal: number }) {
  const t = useTranslations("zikir.goal");
  const n = useLocalizedNumber();
  const counts = useZikirStore((s) => s.counts);
  const history = useZikirStore((s) => s.history);
  const progress = dayGoalProgress(localDateKey(), [{ kind, id, target: goal }], counts, history)[0]!;
  const text = t(kind === "item" ? "today" : "rounds", { done: n(progress.done), goal: n(goal) });

  return (
    <div className="flex flex-col gap-1.5">
      <Progress
        value={Math.min(100, (progress.done / goal) * 100)}
        aria-label={text}
        className={progress.met ? "h-1.5" : "h-1.5 **:data-[slot=progress-indicator]:bg-gold"}
      />
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {progress.met && <CheckIcon className="size-3.5 text-primary" aria-hidden />}
        {progress.met ? t("reached") : text}
      </p>
    </div>
  );
}
