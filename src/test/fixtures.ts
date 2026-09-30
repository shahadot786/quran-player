import type { Track } from "@/lib/types";

export function makeTrack(overrides: Partial<Track> = {}): Track {
  return {
    reciterId: 1,
    reciterName: "Mishary Alafasy",
    moshafId: 10,
    moshafName: "Hafs",
    server: "https://server.example/alafasy/",
    padded: true,
    surah: 1,
    ...overrides,
  };
}
