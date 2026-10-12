"use client";

import { useNow } from "next-intl";
import { localDateKey } from "@/lib/format";
import { dueReminders, type ReminderId } from "@/lib/reminders";
import { lastCountAt } from "@/lib/zikir/stats";
import { useHydrated } from "@/stores/hydration";
import { useReminderStore } from "@/stores/reminder-store";
import { useStatsStore } from "@/stores/stats-store";
import { useZikirStore } from "@/stores/zikir-store";

const CHECK_MS = 30_000;

/** The reminders that are due right now, re-checked every half minute. */
export function useDueReminders(): ReminderId[] {
  const hydrated = useHydrated();
  const now = useNow({ updateInterval: CHECK_MS });
  const reminders = useReminderStore((s) => s.reminders);
  const goalMinutes = useReminderStore((s) => s.goalMinutes);
  const dismissed = useReminderStore((s) => s.dismissed);
  const today = localDateKey(now);
  const listenedSeconds = useStatsStore((s) => s.daily[today] ?? 0);
  const lastZikirAt = useZikirStore((s) => lastCountAt(s.counts, today));
  if (!hydrated) return [];
  return dueReminders(reminders, now, { listenedSeconds, goalSeconds: goalMinutes * 60, lastZikirAt }, dismissed);
}
