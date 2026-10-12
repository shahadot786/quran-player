import { localDateKey } from "./format";

/** The local midnight of a day key like "2026-10-12". */
export function dayFromKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year!, month! - 1, day!);
}

export type DayCell = { key: string; date: Date };
export type Week = (DayCell | null)[];
export type Level = 0 | 1 | 2 | 3 | 4;

// Monday-first columns of seven days from the week holding 1 January to the week holding 31 December; days of the next or previous year are null.
export function yearWeeks(year: number): Week[] {
  const first = new Date(year, 0, 1);
  const start = new Date(year, 0, 1 - ((first.getDay() + 6) % 7));
  const weeks: Week[] = [];
  for (let cursor = start; cursor.getFullYear() <= year; ) {
    const week: Week = [];
    for (let day = 0; day < 7; day += 1) {
      const date = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + day);
      week.push(date.getFullYear() === year ? { key: localDateKey(date), date } : null);
    }
    weeks.push(week);
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 7);
  }
  return weeks;
}

/** The column where each month starts, for the labels above the grid. */
export function monthColumns(weeks: Week[]): { month: number; column: number }[] {
  const columns: { month: number; column: number }[] = [];
  weeks.forEach((week, column) => {
    const firstOfMonth = week.find((cell) => cell?.date.getDate() === 1);
    if (firstOfMonth) columns.push({ month: firstOfMonth.date.getMonth(), column });
  });
  return columns;
}

// Four shades split the busiest day of the year into quarters, so a quiet year still shows its pattern.
export function levelFor(value: number, max: number): Level {
  if (!(value > 0) || !(max > 0)) return 0;
  return Math.min(4, Math.max(1, Math.ceil((value / max) * 4))) as Level;
}

const inYear = (key: string, year: number) => key.startsWith(`${year}-`);

export function activeDays(values: Record<string, number>, year?: number): number {
  return Object.entries(values).filter(([key, value]) => value > 0 && (year === undefined || inYear(key, year))).length;
}

export function yearMax(values: Record<string, number>, year: number): number {
  return Object.entries(values).reduce((max, [key, value]) => (inYear(key, year) && value > max ? value : max), 0);
}

/** Every year from the first one with data to the current one, newest first. */
export function yearsWithData(keys: string[], currentYear: number): number[] {
  const first = keys.reduce((min, key) => Math.min(min, Number(key.slice(0, 4)) || currentYear), currentYear);
  return Array.from({ length: currentYear - first + 1 }, (_, index) => currentYear - index);
}

/** The Umm al-Qura Hijri date in pieces, so the era word can be chosen per language. */
export function hijriParts(date: Date, locale: string): { day: string; month: string; year: string } {
  const parts = new Intl.DateTimeFormat(`${locale}-u-ca-islamic-umalqura`, { day: "numeric", month: "long", year: "numeric" }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((entry) => entry.type === type)?.value ?? "";
  return { day: part("day"), month: part("month"), year: part("year") };
}

const RAMADAN = 9;
const SEARCH_DAYS = 400;
const hijriMonth = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", { month: "numeric" });
const monthOf = (date: Date) => Number(hijriMonth.formatToParts(date).find((part) => part.type === "month")?.value);

/** The last day of the Ramadan in progress, or else of the next one, by the Umm al-Qura calendar. */
export function ramadanEnd(from: Date): string | null {
  let seen = false;
  for (let offset = 0; offset < SEARCH_DAYS; offset += 1) {
    const date = new Date(from.getFullYear(), from.getMonth(), from.getDate() + offset, 12);
    const inRamadan = monthOf(date) === RAMADAN;
    if (inRamadan) seen = true;
    else if (seen) return localDateKey(new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1));
  }
  return null;
}
