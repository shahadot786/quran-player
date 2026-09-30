import { beforeEach, describe, expect, it, vi } from "vitest";

const getSurahTimings = vi.hoisted(() => vi.fn());
vi.mock("@/lib/api/timings", () => ({ getSurahTimings }));

import { GET } from "./route";

const request = (query: string) => new Request(`http://localhost/api/timings?${query}`);
beforeEach(() => getSurahTimings.mockReset());

describe("GET /api/timings", () => {
  it("returns cacheable timings", async () => {
    getSurahTimings.mockResolvedValue({ preamble: null, ayahs: [{ ayah: 1, start: 0, end: 5 }] });
    const res = await GET(request("moshaf=123&server=https%3A%2F%2Fs.example%2F&surah=1"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Cache-Control")).toContain("s-maxage=86400");
    expect(await res.json()).toEqual({ preamble: null, ayahs: [{ ayah: 1, start: 0, end: 5 }] });
    expect(getSurahTimings).toHaveBeenCalledWith({ id: 123, server: "https://s.example/" }, 1);
  });

  it("answers 404 without caching when there are no timings, including on lookup errors", async () => {
    getSurahTimings.mockResolvedValueOnce(null);
    const missing = await GET(request("moshaf=1&surah=2"));
    expect(missing.status).toBe(404);
    expect(missing.headers.get("Cache-Control")).toBeNull();

    getSurahTimings.mockRejectedValueOnce(new Error("upstream down"));
    expect((await GET(request("moshaf=1&surah=2"))).status).toBe(404);
  });

  it("rejects malformed parameters", async () => {
    expect((await GET(request("moshaf=abc&surah=1"))).status).toBe(400);
    expect((await GET(request("moshaf=1"))).status).toBe(400);
    expect((await GET(request("moshaf=1.5&surah=1"))).status).toBe(400);
    expect(getSurahTimings).not.toHaveBeenCalled();
  });
});
