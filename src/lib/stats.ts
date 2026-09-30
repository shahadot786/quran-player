import { localDateKey } from "./format";

export const STREAK_MIN_SECONDS = 60;
export const WEEK_DAYS = 7;
export const TOP_RECITERS = 5;

function shiftDay(date: Date, days: number) {
  const shifted = new Date(date);
  shifted.setDate(shifted.getDate() + days);
  return shifted;
}

function parseDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year!, month! - 1, day);
}

export function computeStreaks(daily: Record<string, number>, today = new Date()) {
  const isActive = (date: Date) => (daily[localDateKey(date)] ?? 0) >= STREAK_MIN_SECONDS;

  let cursor = isActive(today) ? today : shiftDay(today, -1);
  let current = 0;
  while (isActive(cursor)) {
    current += 1;
    cursor = shiftDay(cursor, -1);
  }

  let longest = 0;
  let run = 0;
  let previous: string | null = null;
  for (const key of Object.keys(daily).sort()) {
    if ((daily[key] ?? 0) < STREAK_MIN_SECONDS) continue;
    run = previous && localDateKey(shiftDay(parseDateKey(previous), 1)) === key ? run + 1 : 1;
    longest = Math.max(longest, run);
    previous = key;
  }

  return { current, longest };
}

export function lastDays(daily: Record<string, number>, count = WEEK_DAYS, today = new Date()) {
  return Array.from({ length: count }, (_, i) => {
    const date = shiftDay(today, i - (count - 1));
    return { date, seconds: daily[localDateKey(date)] ?? 0 };
  });
}

export function topReciters(reciters: Record<number, { name: string; seconds: number }>, limit = TOP_RECITERS) {
  return Object.entries(reciters)
    .map(([id, { name, seconds }]) => ({ id: Number(id), name, seconds }))
    .sort((a, b) => b.seconds - a.seconds)
    .slice(0, limit);
}

export function distinctCompleted(completed: Record<string, { surah: number }>) {
  return new Set(Object.values(completed).map((entry) => entry.surah)).size;
}
