import { buildAudioUrl } from "../audio-url";
import type { SourceReciter } from "../types";

const BASE = "https://api.quran.com/api/v4";
export const QURAN_COM_ID_OFFSET = 100_000;

export type Recitation = { id: number; reciter_name: string; style: string | null };
export type AudioFile = { chapter_id: number; audio_url: string };

export function toQuranComReciter(recitation: Recitation, files: AudioFile[]): SourceReciter | null {
  const urls = new Map(files.map((f) => [f.chapter_id, f.audio_url]));
  const first = urls.get(1);
  if (!first) return null;
  const server = first.slice(0, first.lastIndexOf("/") + 1);
  const padded = first.endsWith("/001.mp3");
  const surahs = [...urls]
    .filter(([surah, url]) => url === buildAudioUrl(server, surah, padded))
    .map(([surah]) => surah)
    .sort((a, b) => a - b);
  const id = QURAN_COM_ID_OFFSET + recitation.id;
  return {
    id,
    name: recitation.reciter_name.replace(/`/g, "'"),
    moshafs: [{ id, name: recitation.style ?? "Murattal", server, padded, downloadable: true, surahs }],
  };
}

export async function fetchQuranComReciters(): Promise<SourceReciter[]> {
  const res = await fetch(`${BASE}/resources/recitations`, { next: { revalidate: 86400 } });
  if (!res.ok) throw new Error(`quran.com responded ${res.status}`);
  const { recitations } = (await res.json()) as { recitations: Recitation[] };

  const reciters = await Promise.all(
    recitations.map(async (recitation) => {
      const filesRes = await fetch(`${BASE}/chapter_recitations/${recitation.id}`, { next: { revalidate: 86400 } });
      if (!filesRes.ok) return null;
      const { audio_files } = (await filesRes.json()) as { audio_files: AudioFile[] };
      return toQuranComReciter(recitation, audio_files);
    }),
  );
  return reciters.filter((r): r is SourceReciter => r !== null);
}
