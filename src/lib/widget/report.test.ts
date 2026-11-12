import { describe, expect, it } from "vitest";
import type { ReportRow } from "@/lib/widget/server/store";
import { DEFAULT_RANGE, parseRange, sinceDay, summarize, toCsv } from "./report";

const row = (day: string, host: string, event: ReportRow["event"], hits: number, uniques = hits): ReportRow => ({ day, host, event, hits, uniques });

describe("summarize", () => {
  it("is empty for no rows", () => {
    expect(summarize([])).toEqual({ totals: { views: 0, visitors: 0, plays: 0, clicks: 0, clickRate: null }, hosts: [], days: [] });
  });

  const rows = [
    row("2026-11-12", "metrokoi.com", "view", 10, 6),
    row("2026-11-12", "metrokoi.com", "play", 4, 3),
    row("2026-11-12", "metrokoi.com", "click", 2, 2),
    row("2026-11-11", "metrokoi.com", "view", 5, 5),
    row("2026-11-12", "other.com", "view", 20, 12),
    row("2026-11-12", "quiet.com", "play", 1, 1),
  ];

  it("totals every event", () => {
    expect(summarize(rows).totals).toEqual({ views: 35, visitors: 23, plays: 5, clicks: 2, clickRate: 5.7 });
  });

  it("groups by host, busiest first, with the click rate", () => {
    expect(summarize(rows).hosts).toEqual([
      { host: "other.com", views: 20, visitors: 12, plays: 0, clicks: 0, clickRate: 0 },
      { host: "metrokoi.com", views: 15, visitors: 11, plays: 4, clicks: 2, clickRate: 13.3 },
      { host: "quiet.com", views: 0, visitors: 0, plays: 1, clicks: 0, clickRate: null },
    ]);
  });

  it("groups by day, newest first", () => {
    expect(summarize(rows).days.map((d) => [d.day, d.views, d.visitors, d.plays, d.clicks])).toEqual([
      ["2026-11-12", 30, 18, 5, 2],
      ["2026-11-11", 5, 5, 0, 0],
    ]);
  });
});

describe("parseRange", () => {
  it("takes the offered ranges and falls back otherwise", () => {
    expect(parseRange("7")).toBe(7);
    expect(parseRange(["90", "7"])).toBe(90);
    for (const bad of [undefined, "", "5", "30; drop", "-1"]) expect(parseRange(bad)).toBe(DEFAULT_RANGE);
  });
});

describe("sinceDay", () => {
  it("includes today in the range", () => {
    const now = new Date("2026-11-12T10:00:00Z");
    expect(sinceDay(1, now)).toBe("2026-11-12");
    expect(sinceDay(7, now)).toBe("2026-11-06");
  });
});

describe("toCsv", () => {
  it("has a header and one line per row, newest day first", () => {
    expect(toCsv([row("2026-11-11", "b.com", "view", 2, 1), row("2026-11-12", "a.com", "play", 3, 2), row("2026-11-12", "a.com", "click", 1, 1)])).toBe(
      "day,host,event,hits,uniques\n2026-11-12,a.com,click,1,1\n2026-11-12,a.com,play,3,2\n2026-11-11,b.com,view,2,1\n",
    );
  });

  it("is just the header for no rows", () => expect(toCsv([])).toBe("day,host,event,hits,uniques\n"));

  it("keeps a host from being read as a formula or splitting a line", () => {
    const csv = toCsv([row("2026-11-12", "=cmd|x", "view", 1, 1), row("2026-11-12", 'a,"b', "view", 1, 1)]);
    expect(csv).toContain("'=cmd|x");
    expect(csv).toContain('"a,""b"');
  });
});
