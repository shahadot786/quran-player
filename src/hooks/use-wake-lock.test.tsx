import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useWakeLock, wakeLockSupported } from "./use-wake-lock";

const release = vi.fn(() => Promise.resolve());
const request = vi.fn(() => Promise.resolve({ release }));

afterEach(() => {
  Reflect.deleteProperty(navigator, "wakeLock");
  request.mockClear();
  release.mockClear();
});

const install = () => Object.defineProperty(navigator, "wakeLock", { value: { request }, configurable: true });

describe("useWakeLock", () => {
  it("asks for the screen lock while enabled and lets go on the way out", async () => {
    install();
    const { unmount } = renderHook(() => useWakeLock(true));
    await vi.waitFor(() => expect(request).toHaveBeenCalledWith("screen"));
    unmount();
    await vi.waitFor(() => expect(release).toHaveBeenCalled());
  });

  it("does nothing while switched off", () => {
    install();
    renderHook(() => useWakeLock(false));
    expect(request).not.toHaveBeenCalled();
  });

  it("asks again when the tab comes back", async () => {
    install();
    renderHook(() => useWakeLock(true));
    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(1));
    document.dispatchEvent(new Event("visibilitychange"));
    await vi.waitFor(() => expect(request).toHaveBeenCalledTimes(2));
  });

  it("copes with a browser that refuses", async () => {
    Object.defineProperty(navigator, "wakeLock", { value: { request: () => Promise.reject(new Error("denied")) }, configurable: true });
    expect(() => renderHook(() => useWakeLock(true))).not.toThrow();
  });

  it("does nothing, quietly, where the API does not exist", () => {
    expect(wakeLockSupported()).toBe(false);
    expect(() => renderHook(() => useWakeLock(true))).not.toThrow();
  });

  it("reports support", () => {
    install();
    expect(wakeLockSupported()).toBe(true);
  });
});
