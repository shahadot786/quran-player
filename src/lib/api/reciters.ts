import "server-only";
import { cache } from "react";
import type { Reciter, ReciterSummary, SourceReciter } from "../types";
import { islamicNetworkReciters } from "./islamic-network";
import { mergeReciters } from "./merge";
import { fetchMp3QuranReciters } from "./mp3quran";
import { fetchQuranComReciters } from "./quran-com";

export const FEATURED_RECITER_IDS = [123, 51, 118, 112, 30, 92, 31, 4];

async function fromSource(label: string, fetchSource: () => Promise<SourceReciter[]>) {
  try {
    return await fetchSource();
  } catch (error) {
    console.error(`${label} reciters unavailable`, error);
    return [];
  }
}

export const getReciters = cache(async (): Promise<Reciter[]> => {
  const [mp3quran, quranCom] = await Promise.all([
    fromSource("mp3quran", fetchMp3QuranReciters),
    fromSource("quran.com", fetchQuranComReciters),
  ]);
  return mergeReciters([mp3quran, quranCom, islamicNetworkReciters()]);
});

export async function getReciter(id: number) {
  const reciters = await getReciters();
  return reciters.find((r) => r.id === id);
}

export function summarize(reciter: Reciter): ReciterSummary {
  return { id: reciter.id, name: reciter.name, moshafCount: reciter.moshafs.length };
}

export async function getFeaturedReciters() {
  const reciters = await getReciters();
  const featured = FEATURED_RECITER_IDS.map((id) => reciters.find((r) => r.id === id)).filter(
    (r): r is Reciter => r !== undefined,
  );
  return (featured.length ? featured : reciters.slice(0, 8)).map(summarize);
}
