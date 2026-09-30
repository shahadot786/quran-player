import { beforeEach, describe, expect, it, vi } from "vitest";
import { makeTrack } from "@/test/fixtures";

const downloads = vi.hoisted(() => ({
  downloadsSupported: vi.fn(() => true),
  listDownloads: vi.fn(),
  downloadTrack: vi.fn(),
  removeDownload: vi.fn(() => Promise.resolve()),
}));
vi.mock("@/lib/downloads", () => downloads);

import { useDownloadsStore } from "./downloads-store";

const store = () => useDownloadsStore.getState();
const track = makeTrack({ moshafId: 4, surah: 9 });
const record = { key: "4:9", track, size: 1000, savedAt: 1 };

beforeEach(() => {
  useDownloadsStore.setState(useDownloadsStore.getInitialState(), true);
  Object.values(downloads).forEach((fn) => fn.mockReset());
  downloads.downloadsSupported.mockReturnValue(true);
  downloads.removeDownload.mockResolvedValue(undefined);
});

describe("downloads store", () => {
  it("loads records once", async () => {
    downloads.listDownloads.mockResolvedValue([record]);
    await store().load();
    await store().load();
    expect(store().records).toEqual({ "4:9": record });
    expect(store().loaded).toBe(true);
    expect(downloads.listDownloads).toHaveBeenCalledTimes(1);
  });

  it("skips loading when the browser cannot store audio", async () => {
    downloads.downloadsSupported.mockReturnValue(false);
    await store().load();
    expect(downloads.listDownloads).not.toHaveBeenCalled();
    expect(store().loaded).toBe(false);
  });

  it("tracks progress while downloading and stores the record when done", async () => {
    let seen: Record<string, number> = {};
    downloads.downloadTrack.mockImplementation(async (_track, onProgress: (ratio: number) => void) => {
      onProgress(0.5);
      seen = { ...store().progress };
      return record;
    });
    await expect(store().start(track)).resolves.toEqual(record);
    expect(seen).toEqual({ "4:9": 0.5 });
    expect(store().progress).toEqual({});
    expect(store().records["4:9"]).toEqual(record);
  });

  it("clears progress and rethrows when a download fails", async () => {
    downloads.downloadTrack.mockRejectedValue(new Error("network"));
    await expect(store().start(track)).rejects.toThrow("network");
    expect(store().progress).toEqual({});
    expect(store().records).toEqual({});
  });

  it("removes a record", async () => {
    useDownloadsStore.setState({ records: { "4:9": record } });
    await store().remove(track);
    expect(downloads.removeDownload).toHaveBeenCalledWith(track);
    expect(store().records).toEqual({});
  });
});
