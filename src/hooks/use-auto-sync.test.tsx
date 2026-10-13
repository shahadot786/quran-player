import { act, renderHook, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import messages from "../../messages/en.json";
import { SyncError } from "@/lib/sync/client";
import { generateKey } from "@/lib/sync/key";
import { useHydrated } from "@/stores/hydration";
import { useSyncStore } from "@/stores/sync-store";
import { createFakeSyncApi } from "@/test/fake-sync-api";
import { resetStores } from "@/test/reset-stores";
import { useAutoSync } from "./use-auto-sync";

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }));
vi.mock("sonner", () => ({ toast }));

const wrapper = ({ children }: { children: ReactNode }) => (
  <NextIntlClientProvider locale="en" messages={messages}>
    {children}
  </NextIntlClientProvider>
);

const YESTERDAY = Date.now() - 24 * 60 * 60 * 1000;

function setUp(patch: Partial<ReturnType<typeof useSyncStore.getState>> = {}) {
  useSyncStore.setState({ auto: true, key: generateKey(), lastSyncedAt: YESTERDAY, ...patch });
  useHydrated.setState(true);
}

beforeEach(() => {
  resetStores();
  toast.success.mockClear();
  toast.error.mockClear();
  Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
});
afterEach(() => useHydrated.setState(false));

describe("useAutoSync", () => {
  it("syncs on the first open of a new day and says so", async () => {
    const cloud = createFakeSyncApi();
    setUp();
    renderHook(() => useAutoSync(cloud.api), { wrapper });
    await waitFor(() => expect(toast.success).toHaveBeenCalledWith("Auto sync done", expect.objectContaining({ description: expect.any(String) })));
    expect(cloud.records.size).toBe(1);
    expect(new Date(useSyncStore.getState().lastSyncedAt!).toDateString()).toBe(new Date().toDateString());
  });

  it("does not run again later the same day, however many times the app comes back into view", async () => {
    const cloud = createFakeSyncApi();
    setUp();
    renderHook(() => useAutoSync(cloud.api), { wrapper });
    await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(1));
    await act(async () => {
      document.dispatchEvent(new Event("visibilitychange"));
      window.dispatchEvent(new Event("online"));
    });
    expect(cloud.calls.put).toBe(1);
    expect(toast.success).toHaveBeenCalledTimes(1);
  });

  it("does nothing when it is off, when nothing was ever synced, or before the app has loaded its data", async () => {
    const cloud = createFakeSyncApi();
    setUp({ auto: false });
    renderHook(() => useAutoSync(cloud.api), { wrapper });
    setUp({ lastSyncedAt: null });
    renderHook(() => useAutoSync(cloud.api), { wrapper });
    useHydrated.setState(false);
    useSyncStore.setState({ auto: true, lastSyncedAt: YESTERDAY });
    renderHook(() => useAutoSync(cloud.api), { wrapper });
    await act(async () => {});
    expect(cloud.calls.get).toBe(0);
    expect(toast.success).not.toHaveBeenCalled();
  });

  it("stays quiet offline and syncs when the connection comes back", async () => {
    const cloud = createFakeSyncApi();
    setUp();
    Object.defineProperty(navigator, "onLine", { value: false, configurable: true });
    renderHook(() => useAutoSync(cloud.api), { wrapper });
    await act(async () => {});
    expect(cloud.calls.get).toBe(0);
    expect(toast.error).not.toHaveBeenCalled();

    Object.defineProperty(navigator, "onLine", { value: true, configurable: true });
    await act(async () => void window.dispatchEvent(new Event("online")));
    await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(1));
  });

  it("tells about a failure once a day and tries again later", async () => {
    const cloud = createFakeSyncApi();
    setUp();
    cloud.failNext(new SyncError("server"));
    renderHook(() => useAutoSync(cloud.api), { wrapper });
    await waitFor(() => expect(toast.error).toHaveBeenCalledTimes(1));
    expect(toast.error).toHaveBeenCalledWith("Auto sync didn’t finish", expect.objectContaining({ description: expect.stringContaining("next time you open the app") }));
    expect(useSyncStore.getState().lastSyncedAt).toBe(YESTERDAY);

    cloud.failNext(new SyncError("server"));
    await act(async () => void window.dispatchEvent(new Event("online")));
    await waitFor(() => expect(cloud.calls.get).toBe(2));
    expect(toast.error).toHaveBeenCalledTimes(1);

    await act(async () => void window.dispatchEvent(new Event("online")));
    await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(1));
  });
});
