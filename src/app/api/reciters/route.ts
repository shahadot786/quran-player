import { getReciters, summarize } from "@/lib/api/reciters";

export const revalidate = 86400;

export async function GET() {
  const reciters = await getReciters();
  return Response.json(reciters.map(summarize));
}
