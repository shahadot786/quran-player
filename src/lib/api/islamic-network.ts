import editions from "@/data/islamic-network.json";
import { SURAHS } from "../surahs";
import type { SourceReciter } from "../types";

const CDN = "https://cdn.islamic.network/quran/audio-surah/128/";
const ALL_SURAHS = SURAHS.map((s) => s.id);

export type IslamicNetworkEdition = { id: number; identifier: string; name: string };

export function toIslamicNetworkReciter({ id, identifier, name }: IslamicNetworkEdition): SourceReciter {
  const variant = /\(([^)]+)\)/.exec(name)?.[1];
  return {
    id,
    name: name.replace(/\s*\([^)]*\)/g, "").trim(),
    moshafs: [
      {
        id,
        name: variant ? variant[0]!.toUpperCase() + variant.slice(1) : "Murattal",
        server: `${CDN}${identifier}/`,
        padded: false,
        downloadable: false,
        surahs: ALL_SURAHS,
      },
    ],
  };
}

export function islamicNetworkReciters(): SourceReciter[] {
  return (editions as IslamicNetworkEdition[]).map(toIslamicNetworkReciter);
}
