"use client";

import { trackKey } from "@/lib/audio-url";
import type { Track } from "@/lib/types";
import { selectCurrentTrack, usePlayerStore } from "@/stores/player-store";

export function useTrackPlayback(track: Track) {
  const key = trackKey(track);
  const isCurrent = usePlayerStore((s) => {
    const current = selectCurrentTrack(s);
    return current ? trackKey(current) === key : false;
  });
  const isPlaying = usePlayerStore((s) => s.isPlaying) && isCurrent;
  const progress = usePlayerStore((s) => {
    if (isCurrent && s.duration) return s.currentTime / s.duration;
    const saved = s.positions[key];
    return saved?.duration ? saved.time / saved.duration : 0;
  });

  const toggle = (queue: Track[]) => {
    const player = usePlayerStore.getState();
    if (isCurrent) {
      player.toggle();
      return;
    }
    const index = queue.findIndex((t) => trackKey(t) === key);
    if (index === -1) player.playQueue([track], 0);
    else player.playQueue(queue, index);
  };

  return { isCurrent, isPlaying, progress, toggle };
}
