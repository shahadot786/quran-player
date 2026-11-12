import { localDateKey } from "@/lib/format";
import { computeStreaks } from "@/lib/stats";

export function embedStats(daily: Record<string, number>, completed: Record<string, unknown>, today = new Date()) {
  return {
    minutes: Math.floor((daily[localDateKey(today)] ?? 0) / 60),
    streak: computeStreaks(daily, today).current,
    finished: new Set(Object.keys(completed).map((key) => key.split(":")[1])).size,
  };
}
