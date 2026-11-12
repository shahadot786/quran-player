import { normalizeHost } from "@/lib/embed/options";
import { parseRange, sinceDay, toCsv } from "@/lib/widget/report";
import { widgetDeps } from "@/lib/widget/server/deps";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const days = parseRange(searchParams.get("days") ?? undefined);
  const host = normalizeHost(searchParams.get("host") ?? undefined);
  const { store, now } = widgetDeps();
  if (!store) return new Response("Counting is not set up on this server.", { status: 503 });

  try {
    const rows = (await store.report(sinceDay(days, now()))).filter((row) => !host || row.host === host);
    return new Response(toCsv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="tilawah-widget-${days}d${host ? `-${host}` : ""}.csv"`,
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch {
    return new Response("The numbers could not be loaded.", { status: 500 });
  }
}
