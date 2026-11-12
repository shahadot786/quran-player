import type { ReportRow } from "@/lib/widget/server/store";

export type Counts = { views: number; visitors: number; plays: number; clicks: number };
export type HostRow = Counts & { host: string; clickRate: number | null };
export type DayRow = Counts & { day: string };

const empty = (): Counts => ({ views: 0, visitors: 0, plays: 0, clicks: 0 });

function add(into: Counts, { event, hits, uniques }: ReportRow) {
  if (event === "view") {
    into.views += hits;
    into.visitors += uniques;
  } else if (event === "play") into.plays += hits;
  else into.clicks += hits;
}

const rate = ({ clicks, views }: Counts) => (views === 0 ? null : Math.round((clicks / views) * 1000) / 10);

/** Visitors are the `view` uniques, which are per day, so a longer range adds up daily visitors. */
export function summarize(rows: ReportRow[]) {
  const totals = empty();
  const hosts = new Map<string, Counts>();
  const days = new Map<string, Counts>();
  for (const row of rows) {
    add(totals, row);
    add(hosts.get(row.host) ?? hosts.set(row.host, empty()).get(row.host)!, row);
    add(days.get(row.day) ?? days.set(row.day, empty()).get(row.day)!, row);
  }
  return {
    totals: { ...totals, clickRate: rate(totals) },
    hosts: [...hosts].map(([host, counts]): HostRow => ({ host, ...counts, clickRate: rate(counts) })).sort((a, b) => b.views - a.views || a.host.localeCompare(b.host)),
    days: [...days].map(([day, counts]): DayRow => ({ day, ...counts })).sort((a, b) => b.day.localeCompare(a.day)),
  };
}

export const RANGES = [7, 30, 90] as const;
export const DEFAULT_RANGE = 30;

export const parseRange = (value: string | string[] | undefined) => RANGES.find((days) => String(days) === (Array.isArray(value) ? value[0] : value)) ?? DEFAULT_RANGE;

export function sinceDay(days: number, now: Date) {
  return new Date(now.getTime() - (days - 1) * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

// A cell that starts like a formula is prefixed, so a spreadsheet shows it as text instead of running it.
const csvCell = (value: string | number) => {
  const text = String(value);
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return /[",\n\r]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
};

export function toCsv(rows: ReportRow[]) {
  const sorted = [...rows].sort((a, b) => b.day.localeCompare(a.day) || a.host.localeCompare(b.host) || a.event.localeCompare(b.event));
  return [["day", "host", "event", "hits", "uniques"], ...sorted.map((row) => [row.day, row.host, row.event, row.hits, row.uniques])].map((line) => line.map(csvCell).join(",")).join("\n") + "\n";
}
