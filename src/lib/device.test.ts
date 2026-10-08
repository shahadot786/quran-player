import { beforeEach, describe, expect, it } from "vitest";
import { DEVICE_KEY, getDeviceId } from "./device";

beforeEach(() => localStorage.clear());

describe("getDeviceId", () => {
  it("creates an id once and keeps returning it", () => {
    const first = getDeviceId();
    expect(first).toMatch(/^[0-9a-f-]{36}$/);
    expect(getDeviceId()).toBe(first);
    expect(localStorage.getItem(DEVICE_KEY)).toBe(first);
  });

  it("keeps an id that is already saved", () => {
    localStorage.setItem(DEVICE_KEY, "saved-id");
    expect(getDeviceId()).toBe("saved-id");
  });

  it("still gives a stable id for this page load when storage is unavailable", () => {
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = () => {
      throw new Error("blocked");
    };
    try {
      const id = getDeviceId();
      expect(id).toMatch(/^[0-9a-f-]{36}$/);
      expect(getDeviceId()).toBe(id);
    } finally {
      Storage.prototype.getItem = original;
    }
  });
});
