import { describe, expect, it } from "vitest";
import { makeTrack } from "@/test/fixtures";
import { buildAudioUrl, moshafQueue, toTrack, trackKey, trackUrl } from "./audio-url";

describe("buildAudioUrl", () => {
  it("pads surah numbers to three digits by default", () => {
    expect(buildAudioUrl("https://s.example/a/", 1)).toBe("https://s.example/a/001.mp3");
    expect(buildAudioUrl("https://s.example/a/", 36)).toBe("https://s.example/a/036.mp3");
    expect(buildAudioUrl("https://s.example/a/", 114)).toBe("https://s.example/a/114.mp3");
  });

  it("leaves the number unpadded for quran.com sources", () => {
    expect(buildAudioUrl("https://s.example/q/", 2, false)).toBe("https://s.example/q/2.mp3");
  });
});

describe("track helpers", () => {
  it("builds the url from the track's own server and padding", () => {
    expect(trackUrl(makeTrack({ surah: 7 }))).toBe("https://server.example/alafasy/007.mp3");
    expect(trackUrl(makeTrack({ surah: 7, padded: false }))).toBe("https://server.example/alafasy/7.mp3");
  });

  it("keys a track by moshaf and surah", () => {
    expect(trackKey(makeTrack({ moshafId: 3, surah: 18 }))).toBe("3:18");
  });

  it("maps a moshaf to all 114 surahs in order", () => {
    const moshaf = { id: 5, name: "Hafs", server: "https://s.example/", padded: true, downloadable: false, synced: true };
    const queue = moshafQueue({ id: 9, name: "Reciter" }, moshaf);
    expect(queue).toHaveLength(114);
    expect(queue.map((t) => t.surah).slice(0, 3)).toEqual([1, 2, 3]);
    expect(queue.at(-1)?.surah).toBe(114);
    expect(queue[0]).toEqual(toTrack({ id: 9, name: "Reciter" }, moshaf, 1));
    expect(queue[0]).toMatchObject({ reciterId: 9, moshafId: 5, moshafName: "Hafs", server: "https://s.example/", downloadable: false, synced: true });
  });
});
