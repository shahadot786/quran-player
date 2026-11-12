import { afterEach, describe, expect, it, vi } from "vitest";
import { notifyHost } from "./host-bridge";

afterEach(() => {
  delete (window as unknown as Record<string, unknown>).ReactNativeWebView;
  delete (window as unknown as Record<string, unknown>).Tilawah;
  vi.restoreAllMocks();
});

describe("notifyHost", () => {
  it("posts JSON to React Native and to a Tilawah channel", () => {
    const rn = vi.fn();
    const channel = vi.fn();
    Object.assign(window, { ReactNativeWebView: { postMessage: rn }, Tilawah: { postMessage: channel } });
    notifyHost({ type: "tilawah:open", url: "https://example.com" });
    const text = JSON.stringify({ type: "tilawah:open", url: "https://example.com" });
    expect(rn).toHaveBeenCalledWith(text);
    expect(channel).toHaveBeenCalledWith(text);
  });

  it("posts the object to a parent window", () => {
    const post = vi.fn();
    vi.spyOn(window, "parent", "get").mockReturnValue({ postMessage: post } as unknown as Window);
    notifyHost({ type: "tilawah:resize", height: 300 });
    expect(post).toHaveBeenCalledWith({ type: "tilawah:resize", height: 300 }, "*");
  });

  it("does nothing when nothing listens", () => {
    expect(() => notifyHost({ type: "tilawah:resize", height: 1 })).not.toThrow();
  });
});
