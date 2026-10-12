"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useDueReminders } from "@/hooks/use-due-reminders";
import { localDateKey } from "@/lib/format";
import { toNotify, type ReminderId } from "@/lib/reminders";
import { useReminderStore } from "@/stores/reminder-store";

export const REMINDER_URL: Record<ReminderId, string> = { morning: "/zikir", evening: "/zikir", listening: "/player" };

async function showNotification(title: string, body: string, id: ReminderId) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const options = { body, tag: `reminder-${id}`, icon: "/icons/icon-192.png", data: { url: REMINDER_URL[id] } };
  // Android only shows notifications through the service worker; elsewhere a plain one works when there is none.
  const registration = await navigator.serviceWorker?.getRegistration().catch(() => undefined);
  if (registration) await registration.showNotification(title, options);
  else new Notification(title, options);
}

/** Raises each due reminder once a day while the app is open; the Home banner covers the times it wasn't. */
export function ReminderNotifier() {
  const t = useTranslations("reminders");
  const due = useDueReminders();
  const notified = useReminderStore((s) => s.notified);

  useEffect(() => {
    const now = new Date();
    const fresh = toNotify(due, notified, now);
    if (fresh.length === 0) return;
    useReminderStore.getState().markNotified(fresh, localDateKey(now));
    for (const id of fresh) {
      void showNotification(t(`${id}.title`), t(`${id}.body`), id).catch(() => undefined);
      if (document.visibilityState === "visible") toast(t(`${id}.title`), { description: t(`${id}.body`) });
    }
  }, [due, notified, t]);

  return null;
}
