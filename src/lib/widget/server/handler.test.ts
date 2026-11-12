// @vitest-environment node
import { describe, expect, it } from "vitest";
import { LIMITS } from "@/lib/sync/server/rate-limit";
import { handleTrack, handleWidgetCleanup, MAX_TRACK_BYTES, type WidgetDeps } from "./handler";
import { createMemoryTracker } from "./memory-tracker";

const SITE = "https://tilawah.test";

function setup(overrides: Partial<WidgetDeps> = {}) {
  const store = createMemoryTracker();
  const clock = { now: new Date("2026-11-12T10:00:00Z") };
  const deps: WidgetDeps = { store, now: () => clock.now, salt: "salt", secret: "cron-secret", siteOrigin: SITE, ...overrides };
  const track = (body: unknown, init: { ip?: string; agent?: string; origin?: string | null } = {}) =>
    handleTrack(
      new Request(`${SITE}/api/widget/track`, {
        method: "POST",
        headers: {
          "x-forwarded-for": init.ip ?? "203.0.113.7",
          "user-agent": init.agent ?? "Browser/1",
          ...(init.origin === null ? {} : { origin: init.origin ?? SITE }),
        },
        body: typeof body === "string" ? body : JSON.stringify(body),
      }),
      deps,
    );
  return { store, clock, deps, track };
}

const row = (store: ReturnType<typeof createMemoryTracker>, host: string, event: string) => store.daily.get(`2026-11-12|${host}|${event}`);

describe("handleTrack", () => {
  it("counts an event for the day and the host", async () => {
    const { track, store } = setup();
    expect((await track({ event: "view", host: "metrokoi.com" })).status).toBe(204);
    expect(row(store, "metrokoi.com", "view")).toEqual({ hits: 1, uniques: 1 });
  });

  it("counts a visitor once however often they reload, but counts every hit", async () => {
    const { track, store } = setup();
    for (let i = 0; i < 10; i += 1) await track({ event: "view", host: "metrokoi.com" });
    expect(row(store, "metrokoi.com", "view")).toEqual({ hits: 10, uniques: 1 });
  });

  it("counts different visitors, and the same visitor on a new day, as new uniques", async () => {
    const { track, store, clock } = setup();
    await track({ event: "view", host: "a.com" });
    await track({ event: "view", host: "a.com" }, { ip: "198.51.100.9" });
    expect(row(store, "a.com", "view")).toEqual({ hits: 2, uniques: 2 });
    clock.now = new Date("2026-11-13T10:00:00Z");
    await track({ event: "view", host: "a.com" });
    expect(store.daily.get("2026-11-13|a.com|view")).toEqual({ hits: 1, uniques: 1 });
  });

  it("keeps each event separate", async () => {
    const { track, store } = setup();
    await track({ event: "view", host: "a.com" });
    await track({ event: "play", host: "a.com" });
    await track({ event: "click", host: "a.com" });
    expect([row(store, "a.com", "view")?.hits, row(store, "a.com", "play")?.hits, row(store, "a.com", "click")?.hits]).toEqual([1, 1, 1]);
  });

  it("files a missing or odd host under unknown", async () => {
    const { track, store } = setup();
    await track({ event: "view" });
    await track({ event: "view", host: "bad host; drop table" });
    await track({ event: "view", host: 42 });
    expect(row(store, "unknown", "view")?.hits).toBe(3);
  });

  it("cleans the host name", async () => {
    const { track, store } = setup();
    await track({ event: "view", host: "WWW.MetroKoi.com" });
    expect(row(store, "metrokoi.com", "view")?.hits).toBe(1);
  });

  it("refuses events it does not know and bodies that are not JSON objects", async () => {
    const { track, store } = setup();
    expect((await track({ event: "delete" })).status).toBe(400);
    expect((await track({})).status).toBe(400);
    expect((await track("not json")).status).toBe(400);
    expect((await track("null")).status).toBe(400);
    expect(store.daily.size).toBe(0);
  });

  it("refuses a post that comes from another site, but takes one with no origin", async () => {
    const { track, store } = setup();
    expect((await track({ event: "view" }, { origin: "https://evil.test" })).status).toBe(403);
    expect(store.daily.size).toBe(0);
    expect((await track({ event: "view" }, { origin: null })).status).toBe(204);
  });

  it("refuses a body that is too large", async () => {
    const { track } = setup();
    expect((await track({ event: "view", host: "a".repeat(MAX_TRACK_BYTES) })).status).toBe(413);
  });

  it("stops one visitor after the hourly limit, and starts again the next hour", async () => {
    const { track, clock, store } = setup();
    for (let i = 0; i < LIMITS.anyPerIp; i += 1) expect((await track({ event: "view", host: "a.com" })).status).toBe(204);
    const blocked = await track({ event: "view", host: "a.com" });
    expect(blocked.status).toBe(429);
    expect(Number(blocked.headers.get("retry-after"))).toBeGreaterThan(0);
    expect(row(store, "a.com", "view")?.hits).toBe(LIMITS.anyPerIp);
    clock.now = new Date("2026-11-12T11:00:01Z");
    expect((await track({ event: "view", host: "a.com" })).status).toBe(204);
  });

  it("quietly counts nothing without a database or a salt", async () => {
    for (const response of [await setup({ store: null }).track({ event: "view" }), await setup({ salt: "" }).track({ event: "view" })]) {
      expect(response.status).toBe(204);
      expect(response.headers.get("x-counting")).toBe("off");
    }
  });

  it("stores no address, browser or cookie, only a hash", async () => {
    const { track, store } = setup();
    await track({ event: "view", host: "a.com" }, { ip: "203.0.113.77", agent: "SecretAgent/9" });
    const stored = JSON.stringify([...store.visitors, ...store.daily.keys()]);
    expect(stored).not.toContain("203.0.113.77");
    expect(stored).not.toContain("SecretAgent");
    const response = await track({ event: "view", host: "a.com" });
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("answers 500, and not a stack trace, when the database fails", async () => {
    const { track, store } = setup();
    store.record = async () => {
      throw new Error("db down: password=hunter2");
    };
    const response = await track({ event: "view", host: "a.com" });
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain("hunter2");
  });
});

describe("handleWidgetCleanup", () => {
  const call = (deps: WidgetDeps, token?: string) =>
    handleWidgetCleanup(new Request(`${SITE}/api/widget/cleanup`, { headers: token ? { authorization: `Bearer ${token}` } : {} }), deps);

  it("needs the cron secret", async () => {
    const { deps } = setup();
    expect((await call(deps)).status).toBe(401);
    expect((await call(deps, "wrong-secret")).status).toBe(401);
    expect((await call({ ...deps, secret: "" }, "")).status).toBe(401);
  });

  it("removes visitor hashes older than two days and keeps the counts", async () => {
    const { deps, store, track, clock } = setup();
    await track({ event: "view", host: "a.com" });
    clock.now = new Date("2026-11-15T10:00:00Z");
    await track({ event: "view", host: "a.com" });
    const response = await call(deps, "cron-secret");
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ visitorsDeleted: 1 });
    expect(store.visitors.size).toBe(1);
    expect(store.daily.size).toBe(2);
  });
});
