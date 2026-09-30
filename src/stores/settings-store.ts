import { create } from "zustand";
import { persist } from "zustand/middleware";

export type RepeatMode = "off" | "one" | "all";

export const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 1.75, 2] as const;

type SettingsState = {
  volume: number;
  muted: boolean;
  rate: number;
  repeat: RepeatMode;
  autoNext: boolean;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setRate: (rate: number) => void;
  cycleRepeat: () => void;
  setAutoNext: (autoNext: boolean) => void;
};

const NEXT_REPEAT: Record<RepeatMode, RepeatMode> = { off: "all", all: "one", one: "off" };

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      volume: 1,
      muted: false,
      rate: 1,
      repeat: "off",
      autoNext: true,
      setVolume: (volume) => {
        const clamped = Math.min(1, Math.max(0, volume));
        set({ volume: clamped, muted: clamped === 0 });
      },
      toggleMute: () => set((s) => ({ muted: !s.muted })),
      setRate: (rate) => set({ rate }),
      cycleRepeat: () => set((s) => ({ repeat: NEXT_REPEAT[s.repeat] })),
      setAutoNext: (autoNext) => set({ autoNext }),
    }),
    { name: "qp-settings", skipHydration: true },
  ),
);
