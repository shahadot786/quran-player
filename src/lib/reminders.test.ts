import { describe, expect, it } from "vitest";
import { DEFAULT_REMINDERS, dueReminders, isTime, reminderAt, toNotify, type Reminder } from "./reminders";

const at = (hour: number, minute = 0) => new Date(2026, 9, 12, hour, minute);
const on = (patch: Partial<Record<Reminder["id"], string>>): Reminder[] =>
  DEFAULT_REMINDERS.map((reminder) => (patch[reminder.id] ? { ...reminder, enabled: true, time: patch[reminder.id]! } : reminder));
const quiet = { listenedSeconds: 0, goalSeconds: 900, lastZikirAt: null };

describe("reminders", () => {
  it("reads HH:MM times", () => {
    expect(isTime("06:30")).toBe(true);
    expect(isTime("24:00")).toBe(false);
    expect(isTime("6:30")).toBe(false);
    expect(reminderAt("06:30", at(12))).toBe(at(6, 30).getTime());
  });

  it("is due from its time on, and not before", () => {
    const reminders = on({ morning: "06:30" });
    expect(dueReminders(reminders, at(6, 29), quiet, {})).toEqual([]);
    expect(dueReminders(reminders, at(6, 30), quiet, {})).toEqual(["morning"]);
    expect(dueReminders(reminders, at(23), quiet, {})).toEqual(["morning"]);
  });

  it("ignores reminders that are off", () => {
    expect(dueReminders(DEFAULT_REMINDERS, at(23), quiet, {})).toEqual([]);
  });

  it("clears a zikir reminder once zikir is counted after its time, but not by counting before it", () => {
    const reminders = on({ evening: "18:00" });
    expect(dueReminders(reminders, at(19), { ...quiet, lastZikirAt: at(17).getTime() }, {})).toEqual(["evening"]);
    expect(dueReminders(reminders, at(19), { ...quiet, lastZikirAt: at(18, 5).getTime() }, {})).toEqual([]);
  });

  it("clears the listening reminder once the day's goal is met", () => {
    const reminders = on({ listening: "21:00" });
    expect(dueReminders(reminders, at(22), { ...quiet, listenedSeconds: 600 }, {})).toEqual(["listening"]);
    expect(dueReminders(reminders, at(22), { ...quiet, listenedSeconds: 900 }, {})).toEqual([]);
  });

  it("stays away for the rest of the day once waved away, and is back tomorrow", () => {
    const reminders = on({ morning: "06:30" });
    expect(dueReminders(reminders, at(9), quiet, { morning: "2026-10-12" })).toEqual([]);
    expect(dueReminders(reminders, new Date(2026, 9, 13, 9), quiet, { morning: "2026-10-12" })).toEqual(["morning"]);
  });

  it("announces each due reminder once a day", () => {
    expect(toNotify(["morning", "listening"], { morning: "2026-10-12" }, at(9))).toEqual(["listening"]);
  });
});
