import { localDateKey } from "./format";

export type ReminderId = "morning" | "evening" | "listening";
export type Reminder = { id: ReminderId; enabled: boolean; time: string };
export type ReminderContext = {
  /** Seconds listened today. */
  listenedSeconds: number;
  goalSeconds: number;
  /** When zikir was last counted today, if at all. */
  lastZikirAt: number | null;
};

export const DEFAULT_REMINDERS: Reminder[] = [
  { id: "morning", enabled: false, time: "06:30" },
  { id: "evening", enabled: false, time: "18:00" },
  { id: "listening", enabled: false, time: "21:00" },
];

const TIME = /^([01]\d|2[0-3]):([0-5]\d)$/;
export const isTime = (value: string) => TIME.test(value);

/** Today's moment for a "HH:MM" time. */
export function reminderAt(time: string, now: Date): number {
  const [, hours, minutes] = TIME.exec(time) ?? [];
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), Number(hours ?? 0), Number(minutes ?? 0)).getTime();
}

// A reminder is due from its time until it has been dealt with: zikir counted since then, the listening goal met, or waved away today.
export function dueReminders(reminders: Reminder[], now: Date, context: ReminderContext, dismissed: Partial<Record<ReminderId, string>>): ReminderId[] {
  const today = localDateKey(now);
  return reminders
    .filter((reminder) => {
      if (!reminder.enabled || !isTime(reminder.time) || dismissed[reminder.id] === today) return false;
      const at = reminderAt(reminder.time, now);
      if (now.getTime() < at) return false;
      if (reminder.id === "listening") return context.listenedSeconds < context.goalSeconds;
      return context.lastZikirAt === null || context.lastZikirAt < at;
    })
    .map((reminder) => reminder.id);
}

/** Due reminders that haven't been announced with a notification today. */
export const toNotify = (due: ReminderId[], notified: Partial<Record<ReminderId, string>>, now: Date) =>
  due.filter((id) => notified[id] !== localDateKey(now));
