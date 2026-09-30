import { createStore, del, entries, set, type UseStore } from "idb-keyval";
import { trackKey, trackUrl } from "./audio-url";
import { AUDIO_CACHE } from "./cache-names";
import type { Track } from "./types";

export type DownloadRecord = { key: string; track: Track; size: number; savedAt: number };

let idbStore: UseStore | null = null;
function records() {
  idbStore ??= createStore("qp-downloads", "records");
  return idbStore;
}

export function downloadsSupported() {
  return typeof window !== "undefined" && "caches" in window && "indexedDB" in window;
}

export async function listDownloads(): Promise<DownloadRecord[]> {
  const all = await entries<string, DownloadRecord>(records());
  return all.map(([, record]) => record).sort((a, b) => b.savedAt - a.savedAt);
}

export async function fetchFileSize(url: string): Promise<number | null> {
  try {
    const res = await fetch(url, { method: "HEAD" });
    const length = Number(res.headers.get("content-length"));
    return res.ok && length > 0 ? length : null;
  } catch {
    return null;
  }
}

export async function storageEstimate() {
  if (!navigator.storage?.estimate) return null;
  const { usage = 0, quota = 0 } = await navigator.storage.estimate();
  return { usage, quota };
}

export async function downloadTrack(track: Track, onProgress: (ratio: number) => void): Promise<DownloadRecord> {
  const url = trackUrl(track);
  const res = await fetch(url, { mode: "cors" });
  if (!res.ok || !res.body) throw new Error(`Download failed with ${res.status}`);

  const total = Number(res.headers.get("content-length")) || 0;
  const reader = res.body.getReader();
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    received += value.length;
    if (total) onProgress(received / total);
  }

  const blob = new Blob(chunks, { type: "audio/mpeg" });
  const cache = await caches.open(AUDIO_CACHE);
  await cache.put(
    url,
    new Response(blob, { headers: { "Content-Type": "audio/mpeg", "Content-Length": String(blob.size) } }),
  );
  await navigator.storage?.persist?.().catch(() => false);

  const record: DownloadRecord = { key: trackKey(track), track, size: blob.size, savedAt: Date.now() };
  await set(record.key, record, records());
  return record;
}

export async function removeDownload(track: Track) {
  const cache = await caches.open(AUDIO_CACHE);
  await cache.delete(trackUrl(track));
  await del(trackKey(track), records());
}
