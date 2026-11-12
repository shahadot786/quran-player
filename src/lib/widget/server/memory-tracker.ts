import type { WidgetEvent, WidgetStore } from "./store";

export type MemoryTracker = WidgetStore & {
  daily: Map<string, { hits: number; uniques: number }>;
  visitors: Set<string>;
};

export function createMemoryTracker(): MemoryTracker {
  const daily: MemoryTracker["daily"] = new Map();
  const visitors: MemoryTracker["visitors"] = new Set();
  const counters = new Map<string, number>();

  return {
    daily,
    visitors,
    async record(day, host, event: WidgetEvent, visitor) {
      const key = `${day}|${host}|${event}`;
      const seen = `${key}|${visitor}`;
      const row = daily.get(key) ?? { hits: 0, uniques: 0 };
      row.hits += 1;
      if (!visitors.has(seen)) {
        visitors.add(seen);
        row.uniques += 1;
      }
      daily.set(key, row);
    },
    async hit(bucket, windowStart) {
      const key = `${bucket}@${windowStart.toISOString()}`;
      const hits = (counters.get(key) ?? 0) + 1;
      counters.set(key, hits);
      return hits;
    },
    async report(sinceDay) {
      return [...daily].flatMap(([key, { hits, uniques }]) => {
        const [day, host, event] = key.split("|") as [string, string, WidgetEvent];
        return day >= sinceDay ? [{ day, host, event, hits, uniques }] : [];
      });
    },
    async purgeVisitors(day) {
      let removed = 0;
      for (const entry of visitors) {
        if (entry.split("|")[0]! < day) {
          visitors.delete(entry);
          removed += 1;
        }
      }
      return removed;
    },
  };
}
