import { vi } from "vitest";

export function createFakeAudio() {
  return {
    src: "",
    currentTime: 0,
    duration: 0,
    playbackRate: 1,
    defaultPlaybackRate: 1,
    play: vi.fn(() => Promise.resolve()),
    pause: vi.fn(),
    load: vi.fn(),
    removeAttribute: vi.fn(function (this: { src: string }, name: string) {
      if (name === "src") this.src = "";
    }),
  };
}

export type FakeAudio = ReturnType<typeof createFakeAudio>;
