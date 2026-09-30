"use client";

import { useState } from "react";
import { moshafQueue } from "@/lib/audio-url";
import type { Moshaf, Reciter, Track } from "@/lib/types";
import { selectCurrentTrack, usePlayerStore } from "@/stores/player-store";

export type Source = { reciter: Pick<Reciter, "id" | "name">; moshaf: Moshaf; moshafs: Moshaf[] };

function fromTrack(track: Track): Source {
  const moshaf = {
    id: track.moshafId,
    name: track.moshafName,
    server: track.server,
    padded: track.padded,
    downloadable: track.downloadable !== false,
  };
  return { reciter: { id: track.reciterId, name: track.reciterName }, moshaf, moshafs: [moshaf] };
}

function resolve(reciters: Reciter[], reciterId: number, moshafId?: number): Source | null {
  const reciter = reciters.find((r) => r.id === reciterId);
  const moshaf = reciter?.moshafs.find((m) => m.id === moshafId) ?? reciter?.moshafs[0];
  return reciter && moshaf ? { reciter, moshaf, moshafs: reciter.moshafs } : null;
}

export function usePlayerSource(reciters: Reciter[], defaultReciterId: number) {
  const current = usePlayerStore(selectCurrentTrack);
  const [idle, setIdle] = useState(() => resolve(reciters, defaultReciterId) ?? resolve(reciters, reciters[0]?.id ?? 0));

  const source = current
    ? (resolve(reciters, current.reciterId, current.moshafId) ?? fromTrack(current))
    : idle;

  const choose = (reciterId: number, moshafId?: number) => {
    const next = resolve(reciters, reciterId, moshafId);
    if (!next) return;
    setIdle(next);
    const player = usePlayerStore.getState();
    const track = selectCurrentTrack(player);
    if (!track) return;
    const ratio = player.duration ? player.currentTime / player.duration : 0;
    player.playQueue(moshafQueue(next.reciter, next.moshaf), track.surah - 1, { autoplay: player.isPlaying, resumeRatio: ratio });
  };

  return { source, choose };
}
