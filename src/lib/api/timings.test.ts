import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/data/synced-recitations.json", () => ({
  default: { mp3quran: [{ read: 5, folder: "https://server.example/afs/" }], quranCom: [7] },
}));

import { getSurahTimings, isSynced, normalizeFolder } from "./timings";

const fetchMock = vi.fn();
beforeEach(() => vi.stubGlobal("fetch", fetchMock));
afterEach(() => {
  fetchMock.mockReset();
  vi.unstubAllGlobals();
});

const json = (body: unknown, ok = true) => Promise.resolve({ ok, json: () => Promise.resolve(body) });
const fatiha = [
  { ayah: 1, start_time: 0, end_time: 13000 },
  { ayah: 2, start_time: 13000, end_time: 19000 },
  { ayah: 3, start_time: 19000, end_time: 24000 },
  { ayah: 4, start_time: 24000, end_time: 30000 },
  { ayah: 5, start_time: 30000, end_time: 36000 },
  { ayah: 6, start_time: 36000, end_time: 42000 },
  { ayah: 7, start_time: 42000, end_time: 50000 },
];

describe("isSynced", () => {
  it("matches mp3quran recitations by folder, tolerating http and a missing slash", () => {
    expect(isSynced({ id: 1, server: "https://server.example/afs/" })).toBe(true);
    expect(isSynced({ id: 1, server: "http://server.example/afs" })).toBe(true);
    expect(isSynced({ id: 1, server: "https://server.example/other/" })).toBe(false);
  });

  it("matches quran.com recitations by id offset and rejects everything else", () => {
    expect(isSynced({ id: 100007, server: "https://download.quranicaudio.com/qdc/x/" })).toBe(true);
    expect(isSynced({ id: 100008, server: "https://download.quranicaudio.com/qdc/y/" })).toBe(false);
    expect(isSynced({ id: 200007, server: "https://cdn.islamic.network/quran/audio-surah/128/ar.alafasy/" })).toBe(false);
  });

  it("normalizes folders", () => {
    expect(normalizeFolder("http://a.example/x")).toBe("https://a.example/x/");
  });
});

describe("getSurahTimings", () => {
  it("asks mp3quran for the matching reader and surah", async () => {
    fetchMock.mockReturnValue(json(fatiha));
    const timings = await getSurahTimings({ id: 1, server: "https://server.example/afs/" }, 1);
    expect(fetchMock.mock.calls[0]![0]).toBe("https://www.mp3quran.net/api/v3/ayat_timing?surah=1&read=5");
    expect(timings?.ayahs).toHaveLength(7);
    expect(timings?.ayahs[6]).toEqual({ ayah: 7, start: 42, end: 50 });
  });

  it("asks quran.com with segments for its recitations", async () => {
    fetchMock.mockReturnValue(
      json({ audio_file: { timestamps: fatiha.map((r) => ({ verse_key: `1:${r.ayah}`, timestamp_from: r.start_time, timestamp_to: r.end_time })) } }),
    );
    const timings = await getSurahTimings({ id: 100007, server: "https://download.quranicaudio.com/qdc/x/" }, 1);
    expect(fetchMock.mock.calls[0]![0]).toBe("https://api.quran.com/api/v4/chapter_recitations/7/1?segments=true");
    expect(timings?.ayahs).toHaveLength(7);
  });

  it("never calls out for recitations without timings or surahs that don't exist", async () => {
    expect(await getSurahTimings({ id: 200001, server: "https://cdn.islamic.network/x/" }, 1)).toBeNull();
    expect(await getSurahTimings({ id: 1, server: "https://server.example/afs/" }, 115)).toBeNull();
    expect(await getSurahTimings({ id: 1, server: "https://evil.example/" }, 1)).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns null for a failed response or timings that don't fit the surah", async () => {
    fetchMock.mockReturnValueOnce(json(null, false));
    expect(await getSurahTimings({ id: 1, server: "https://server.example/afs/" }, 1)).toBeNull();
    fetchMock.mockReturnValueOnce(json(fatiha.slice(0, 6)));
    expect(await getSurahTimings({ id: 1, server: "https://server.example/afs/" }, 1)).toBeNull();
  });
});
