import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_REMINDERS, type Reminder, type ReminderId } from "@/lib/reminders";

type Days = Partial<Record<ReminderId, string>>;

type ReminderState = {
  reminders: Reminder[];
  /** The daily listening goal the listening reminder checks. */
  goalMinutes: number;
  /** The day each reminder was last waved away. */
  dismissed: Days;
  /** The day each reminder last raised a notification. */
  notified: Days;
  setReminder: (id: ReminderId, patch: Partial<Omit<Reminder, "id">>) => void;
  setGoal: (minutes: number) => void;
  dismiss: (id: ReminderId, day: string) => void;
  markNotified: (ids: ReminderId[], day: string) => void;
};

// Reminders belong to this device, like volume, so they stay out of backups and sync.
export const useReminderStore = create<ReminderState>()(
  persist(
    (set) => ({
      reminders: DEFAULT_REMINDERS,
      goalMinutes: 15,
      dismissed: {},
      notified: {},
      setReminder: (id, patch) => set((s) => ({ reminders: s.reminders.map((reminder) => (reminder.id === id ? { ...reminder, ...patch } : reminder)) })),
      setGoal: (minutes) => set({ goalMinutes: Math.min(600, Math.max(1, Math.round(minutes))) }),
      dismiss: (id, day) => set((s) => ({ dismissed: { ...s.dismissed, [id]: day } })),
      markNotified: (ids, day) => set((s) => ({ notified: { ...s.notified, ...Object.fromEntries(ids.map((id) => [id, day])) } })),
    }),
    { name: "qp-reminders", skipHydration: true },
  ),
);
