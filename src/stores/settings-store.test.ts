import { beforeEach, describe, expect, it } from "vitest";
import { useSettingsStore } from "./settings-store";

beforeEach(() => useSettingsStore.setState(useSettingsStore.getInitialState(), true));

describe("settings store", () => {
  it("clamps volume and mutes at zero", () => {
    const { setVolume } = useSettingsStore.getState();
    setVolume(1.7);
    expect(useSettingsStore.getState()).toMatchObject({ volume: 1, muted: false });
    setVolume(-1);
    expect(useSettingsStore.getState()).toMatchObject({ volume: 0, muted: true });
  });

  it("toggles mute without losing the volume", () => {
    useSettingsStore.getState().setVolume(0.4);
    useSettingsStore.getState().toggleMute();
    expect(useSettingsStore.getState()).toMatchObject({ volume: 0.4, muted: true });
  });

  it("cycles repeat off, all, one and back", () => {
    const { cycleRepeat } = useSettingsStore.getState();
    const seen = [1, 2, 3].map(() => {
      cycleRepeat();
      return useSettingsStore.getState().repeat;
    });
    expect(seen).toEqual(["all", "one", "off"]);
  });

  it("stores the playback rate and auto-next flag", () => {
    useSettingsStore.getState().setRate(1.5);
    useSettingsStore.getState().setAutoNext(false);
    expect(useSettingsStore.getState()).toMatchObject({ rate: 1.5, autoNext: false });
  });
});
