import type { SourceReciter } from "../types";

type Mp3QuranReciter = {
  id: number;
  name: string;
  moshaf: { id: number; name: string; server: string; surah_list: string }[];
};

const ENDPOINT = "https://www.mp3quran.net/api/v3/reciters?language=eng";

export function cleanMoshafName(raw: string) {
  const parts = [...new Set(raw.split(" - ").map((p) => p.replace(/^Rewayat\s+/i, "").trim()))];
  return parts.filter(Boolean).join(", ");
}

export function normalizeMp3Quran(reciters: Mp3QuranReciter[]): SourceReciter[] {
  return reciters
    .map((r) => ({
      id: r.id,
      name: r.name.trim(),
      moshafs: r.moshaf
        .map((m) => ({
          id: m.id,
          name: cleanMoshafName(m.name),
          server: m.server.replace(/^http:/, "https:"),
          padded: true,
          downloadable: true,
          surahs: m.surah_list
            .split(",")
            .map(Number)
            .filter((n) => n >= 1 && n <= 114)
            .sort((a, b) => a - b),
        }))
        .filter((m) => m.surahs.length > 0),
    }))
    .filter((r) => r.moshafs.length > 0)
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchMp3QuranReciters(): Promise<SourceReciter[]> {
  const res = await fetch(ENDPOINT, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`mp3quran responded ${res.status}`);
  const json = (await res.json()) as { reciters: Mp3QuranReciter[] };
  return normalizeMp3Quran(json.reciters);
}
