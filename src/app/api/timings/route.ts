import { getSurahTimings } from "@/lib/api/timings";

const CACHE = "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800";

function toId(value: string | null) {
  return value !== null && /^\d+$/.test(value) ? Number(value) : null;
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const id = toId(params.get("moshaf"));
  const surah = toId(params.get("surah"));
  if (id === null || surah === null) return Response.json(null, { status: 400 });

  const timings = await getSurahTimings({ id, server: params.get("server") ?? "" }, surah).catch(() => null);
  return Response.json(timings, { status: timings ? 200 : 404, headers: timings ? { "Cache-Control": CACHE } : undefined });
}
