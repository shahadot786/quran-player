"use client";

import { create } from "zustand";
import { trackKey } from "@/lib/audio-url";
import { downloadTrack, downloadsSupported, listDownloads, removeDownload, type DownloadRecord } from "@/lib/downloads";
import type { Track } from "@/lib/types";
import { omitKey } from "@/lib/utils";

type DownloadsState = {
  loaded: boolean;
  records: Record<string, DownloadRecord>;
  progress: Record<string, number>;
  load: () => Promise<void>;
  start: (track: Track) => Promise<DownloadRecord>;
  remove: (track: Track) => Promise<void>;
};

export const useDownloadsStore = create<DownloadsState>()((set, get) => ({
  loaded: false,
  records: {},
  progress: {},
  load: async () => {
    if (get().loaded || !downloadsSupported()) return;
    const list = await listDownloads();
    set({ loaded: true, records: Object.fromEntries(list.map((r) => [r.key, r])) });
  },
  start: async (track) => {
    const key = trackKey(track);
    set((s) => ({ progress: { ...s.progress, [key]: 0 } }));
    try {
      const record = await downloadTrack(track, (ratio) => set((s) => ({ progress: { ...s.progress, [key]: ratio } })));
      set((s) => ({ records: { ...s.records, [key]: record } }));
      return record;
    } finally {
      set((s) => ({ progress: omitKey(s.progress, key) }));
    }
  },
  remove: async (track) => {
    await removeDownload(track);
    set((s) => ({ records: omitKey(s.records, trackKey(track)) }));
  },
}));
