import { neon } from "@neondatabase/serverless";
import type { ReportRow, WidgetStore } from "./store";

export function createNeonTracker(connectionString: string): WidgetStore {
  const sql = neon(connectionString);

  return {
    async record(day, host, event, visitor) {
      await sql`
        with fresh as (
          insert into widget_visitors (day, host, event, visitor) values (${day}::date, ${host}, ${event}, ${visitor})
          on conflict do nothing
          returning 1
        )
        insert into widget_daily (day, host, event, hits, uniques)
        values (${day}::date, ${host}, ${event}, 1, (select count(*)::int from fresh))
        on conflict (day, host, event) do update
          set hits = widget_daily.hits + 1, uniques = widget_daily.uniques + excluded.uniques`;
    },
    async hit(bucket, windowStart) {
      const rows = (await sql`
        insert into rate_limits (bucket, window_start, hits) values (${bucket}, ${windowStart.toISOString()}::timestamptz, 1)
        on conflict (bucket, window_start) do update set hits = rate_limits.hits + 1
        returning hits`) as { hits: number }[];
      return rows[0]?.hits ?? 1;
    },
    async report(sinceDay) {
      return (await sql`
        select day::text as day, host, event, hits, uniques from widget_daily where day >= ${sinceDay}::date order by day desc`) as ReportRow[];
    },
    async purgeVisitors(day) {
      const rows = (await sql`with gone as (delete from widget_visitors where day < ${day}::date returning 1) select count(*)::int as n from gone`) as { n: number }[];
      return rows[0]?.n ?? 0;
    },
  };
}
