import "server-only";
import { getReciters } from "@/lib/api/reciters";
import type { Moshaf } from "@/lib/types";
import { WIDGET_RECITER_IDS, WIDGET_RECITER_NAMES } from "./options";

export type WidgetReciter = { id: number; name: string; moshaf: Moshaf };

/** Every reciter in the app, each with its first recitation; the catalogue only keeps recitations that have all 114 surahs. */
export async function getWidgetReciters(): Promise<WidgetReciter[]> {
  const all = await getReciters();
  return all.flatMap((reciter) => (reciter.moshafs[0] ? [{ id: reciter.id, name: reciter.name, moshaf: reciter.moshafs[0] }] : []));
}

const FALLBACK = WIDGET_RECITER_IDS.map((id) => ({ id, name: WIDGET_RECITER_NAMES[id] }));

/** Just the ids and names, for the builder's picker; falls back to a short list if the catalogue is unavailable. */
export async function getReciterChoices(): Promise<{ id: number; name: string }[]> {
  try {
    const all = await getWidgetReciters();
    return all.length > 0 ? all.map(({ id, name }) => ({ id, name })) : FALLBACK;
  } catch {
    return FALLBACK;
  }
}
