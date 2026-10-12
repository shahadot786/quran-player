"use client";

import { BellIcon } from "lucide-react";
import { useId, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { isTime, type Reminder } from "@/lib/reminders";
import { useHydrated } from "@/stores/hydration";
import { useReminderStore } from "@/stores/reminder-store";

type Permission = NotificationPermission | "unsupported";

const readPermission = (): Permission => (typeof Notification === "undefined" ? "unsupported" : Notification.permission);
const listeners = new Set<() => void>();

// Follows changes made in browser settings where the Permissions API reports them, and always after our own request.
function subscribe(callback: () => void) {
  listeners.add(callback);
  let status: PermissionStatus | undefined;
  let active = true;
  navigator.permissions
    ?.query({ name: "notifications" })
    .then((result) => {
      if (!active) return;
      status = result;
      result.addEventListener("change", callback);
    })
    .catch(() => undefined);
  return () => {
    active = false;
    listeners.delete(callback);
    status?.removeEventListener("change", callback);
  };
}

async function requestPermission() {
  if (readPermission() !== "default") return;
  await Notification.requestPermission().catch(() => undefined);
  listeners.forEach((listener) => listener());
}

const usePermission = () => useSyncExternalStore(subscribe, readPermission, () => "unsupported" as Permission);

function ReminderRow({ reminder, onEnable }: { reminder: Reminder; onEnable: () => void }) {
  const t = useTranslations("reminders");
  const id = useId();
  const setReminder = useReminderStore((s) => s.setReminder);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3 first:border-t-0 first:pt-0">
      <div className="flex min-w-0 flex-col">
        <Label htmlFor={`${id}-switch`}>{t(`${reminder.id}.title`)}</Label>
        <span className="text-sm text-muted-foreground">{t(`${reminder.id}.hint`)}</span>
      </div>
      <div className="flex items-center gap-3">
        <Input
          type="time"
          aria-label={t("timeFor", { name: t(`${reminder.id}.title`) })}
          value={reminder.time}
          disabled={!reminder.enabled}
          onChange={(event) => isTime(event.target.value) && setReminder(reminder.id, { time: event.target.value })}
          className="w-auto"
        />
        <Switch
          id={`${id}-switch`}
          checked={reminder.enabled}
          onCheckedChange={(enabled) => {
            setReminder(reminder.id, { enabled });
            if (enabled) onEnable();
          }}
        />
      </div>
    </div>
  );
}

export function ReminderSettings() {
  const t = useTranslations("reminders");
  const hydrated = useHydrated();
  const goalId = useId();
  const reminders = useReminderStore((s) => s.reminders);
  const goalMinutes = useReminderStore((s) => s.goalMinutes);
  const setGoal = useReminderStore((s) => s.setGoal);
  const permission = usePermission();
  const anyOn = reminders.some((reminder) => reminder.enabled);

  return (
    <section id="reminders" aria-labelledby="reminders-heading" className="flex scroll-mt-6 flex-col gap-4 rounded-2xl border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 id="reminders-heading" className="text-lg font-semibold">
            {t("title")}
          </h2>
          <p className="max-w-prose text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <BellIcon aria-hidden className="size-5 shrink-0 text-muted-foreground" />
      </div>

      {hydrated && (
        <>
          <div className="flex flex-col gap-3">
            {reminders.map((reminder) => (
              <ReminderRow key={reminder.id} reminder={reminder} onEnable={() => void requestPermission()} />
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3 border-t pt-3">
            <Label htmlFor={goalId}>{t("goal")}</Label>
            <Input
              id={goalId}
              type="number"
              inputMode="numeric"
              min={1}
              max={600}
              value={goalMinutes}
              onChange={(event) => Number(event.target.value) > 0 && setGoal(Number(event.target.value))}
              className="w-24"
            />
          </div>
          {anyOn && permission === "default" && (
            <div>
              <Button variant="outline" size="sm" onClick={() => void requestPermission()}>
                {t("allow")}
              </Button>
            </div>
          )}
          {anyOn && permission !== "granted" && permission !== "default" && (
            <p className="text-sm text-muted-foreground">{permission === "denied" ? t("blocked") : t("unsupported")}</p>
          )}
          <p className="text-xs text-muted-foreground">{t("limit")}</p>
        </>
      )}
    </section>
  );
}
