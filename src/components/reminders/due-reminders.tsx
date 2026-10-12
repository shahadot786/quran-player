"use client";

import { BellRingIcon, XIcon } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { useDueReminders } from "@/hooks/use-due-reminders";
import { localDateKey } from "@/lib/format";
import { useReminderStore } from "@/stores/reminder-store";
import { REMINDER_URL } from "./reminder-notifier";

/** Reminders still waiting today, so one that fired while the app was closed isn't lost. */
export function DueReminders() {
  const t = useTranslations("reminders");
  const due = useDueReminders();
  if (due.length === 0) return null;
  return (
    <ul aria-label={t("dueLabel")} className="flex flex-col gap-2">
      {due.map((id) => (
        <li key={id} className="flex items-center gap-3 rounded-xl bg-gold/15 p-3 text-sm">
          <BellRingIcon aria-hidden className="size-4 shrink-0" />
          <p className="flex-1">{t(`${id}.body`)}</p>
          <Button asChild size="sm" variant="outline">
            <Link href={REMINDER_URL[id]}>{t(`${id}.action`)}</Link>
          </Button>
          <Button size="icon-sm" variant="ghost" aria-label={t("dismiss", { name: t(`${id}.title`) })} onClick={() => useReminderStore.getState().dismiss(id, localDateKey())}>
            <XIcon />
          </Button>
        </li>
      ))}
    </ul>
  );
}
