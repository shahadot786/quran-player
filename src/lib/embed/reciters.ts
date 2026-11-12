import "server-only";
import { getReciters } from "@/lib/api/reciters";
import type { Moshaf } from "@/lib/types";
import { WIDGET_RECITER_IDS } from "./options";

export type WidgetReciter = { id: number; name: string; moshaf: Moshaf };

export async function getWidgetReciters(): Promise<WidgetReciter[]> {
  const all = await getReciters();
  return WIDGET_RECITER_IDS.flatMap((id) => {
    const reciter = all.find((r) => r.id === id);
    const moshaf = reciter?.moshafs[0];
    return reciter && moshaf ? [{ id, name: reciter.name, moshaf }] : [];
  });
}
