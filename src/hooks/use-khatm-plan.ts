"use client";

import { useMemo } from "react";
import { localDateKey } from "@/lib/format";
import { planTarget, type PlanTarget } from "@/lib/progress/plan";
import { useProgressStore } from "@/stores/progress-store";
import { useStatsStore } from "@/stores/stats-store";
import { useProgressModel } from "./use-progress-model";

export type KhatmPlanView = { finishBy: string; target: PlanTarget; secondsToday: number } | null;

export function useKhatmPlan(): KhatmPlanView {
  const plan = useProgressStore((s) => s.plan);
  const model = useProgressModel();
  const today = localDateKey();
  const secondsToday = useStatsStore((s) => s.daily[today] ?? 0);
  return useMemo(() => {
    if (!plan?.finishBy) return null;
    const ayahsLeft = model.overall.ayahsTotal - model.overall.ayahsHeard;
    const target = planTarget({ finishBy: plan.finishBy, today, ayahsLeft, secondsPerAyah: model.pace?.secondsPerAyah ?? null });
    return { finishBy: plan.finishBy, target, secondsToday };
  }, [plan, model, today, secondsToday]);
}
