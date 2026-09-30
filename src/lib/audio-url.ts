import { SURAHS } from "./surahs";
import type { Moshaf, Reciter, Track } from "./types";

export function buildAudioUrl(server: string, surah: number, padded = true) {
  const file = padded ? String(surah).padStart(3, "0") : String(surah);
  return `${server}${file}.mp3`;
}

export function trackUrl(track: Track) {
  return buildAudioUrl(track.server, track.surah, track.padded);
}

export function trackKey(track: Pick<Track, "moshafId" | "surah">) {
  return `${track.moshafId}:${track.surah}`;
}

export function toTrack(reciter: Pick<Reciter, "id" | "name">, moshaf: Moshaf, surah: number): Track {
  return {
    reciterId: reciter.id,
    reciterName: reciter.name,
    moshafId: moshaf.id,
    moshafName: moshaf.name,
    server: moshaf.server,
    padded: moshaf.padded,
    downloadable: moshaf.downloadable,
    surah,
  };
}

export function moshafQueue(reciter: Pick<Reciter, "id" | "name">, moshaf: Moshaf) {
  return SURAHS.map((surah) => toTrack(reciter, moshaf, surah.id));
}
