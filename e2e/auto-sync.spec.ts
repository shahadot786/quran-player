import { expect, test, type Page } from "@playwright/test";
import { fakeCloud } from "./fake-cloud";

const KEY = "7-quiet-golden-camels-slowly-stroll-past-the-sunny-river-at-dawn";
const DAY = 24 * 60 * 60 * 1000;

const blank = (devices: Record<string, unknown> = {}) => ({
  library: { favoriteReciters: [], favoriteSurahs: [], playlists: [], history: [] },
  stats: { totalSeconds: 0, daily: {}, reciters: {}, completed: {} },
  progress: { slices: {}, lifetime: {}, rounds: [], currentRound: 1, roundStartedAt: null, roundSeconds: 0, paceSeconds: 0, paceAyahs: 0, legacyImportedAt: null },
  zikir: { items: [], groups: [], counts: {}, history: [], builtIns: {} },
  devices,
});

type Seed = { auto?: boolean; lastSyncedAt?: number | null; deviceName?: string | null };

// A device that has synced before: a key, a device id and (optionally) automatic sync switched on.
async function seed(page: Page, { auto = true, lastSyncedAt = Date.now() - DAY, deviceName = null }: Seed = {}) {
  await page.addInitScript(
    (input) => {
      if (localStorage.getItem("e2e-seeded")) return;
      localStorage.setItem("e2e-seeded", "1");
      localStorage.setItem("qp-device-id", "this-device");
      localStorage.setItem("qp-sync", JSON.stringify({ version: 0, state: { key: input.key, lastSyncedAt: input.lastSyncedAt, nudgeDismissedAt: null, auto: input.auto, autoFailedDay: null, deviceName: input.deviceName, devices: {} } }));
    },
    { key: KEY, auto, lastSyncedAt, deviceName },
  );
}

const stored = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem("qp-sync")!).state as { auto: boolean; lastSyncedAt: number | null; autoFailedDay: string | null; devices: Record<string, { name: string; removed: boolean }> });

test("syncs once on the first open of a day, says so, and does not repeat that day", async ({ page }) => {
  const cloud = fakeCloud();
  await cloud.attach(page.context());
  await seed(page);
  await page.goto("/");
  await expect(page.getByText("Auto sync done")).toBeVisible();
  await expect(page.getByText("Your data is up to date with the cloud copy.")).toBeVisible();
  expect(cloud.calls).toEqual(["GET", "PUT"]);
  expect((await stored(page)).lastSyncedAt).toBeGreaterThan(Date.now() - 60_000);

  await page.reload();
  await page.getByRole("link", { name: "Plan a khatm" }).waitFor();
  await page.waitForTimeout(500);
  expect(cloud.calls).toEqual(["GET", "PUT"]);
  await expect(page.getByText("Auto sync done")).toHaveCount(0);
});

test("does nothing when it is off", async ({ page }) => {
  const cloud = fakeCloud();
  await cloud.attach(page.context());
  await seed(page, { auto: false });
  await page.goto("/");
  await page.getByRole("link", { name: "Plan a khatm" }).waitFor();
  await page.waitForTimeout(500);
  expect(cloud.calls).toEqual([]);
  await expect(page.getByText("Auto sync done")).toHaveCount(0);
});

test("does nothing when a sync already happened today", async ({ page }) => {
  const cloud = fakeCloud();
  await cloud.attach(page.context());
  await seed(page, { lastSyncedAt: Date.now() - 60_000 });
  await page.goto("/");
  await page.getByRole("link", { name: "Plan a khatm" }).waitFor();
  await page.waitForTimeout(500);
  expect(cloud.calls).toEqual([]);
});

test("tells about a failure once for the day and keeps the data", async ({ page }) => {
  const cloud = fakeCloud();
  await cloud.attach(page.context());
  cloud.fail(500);
  await seed(page);
  await page.goto("/");
  await expect(page.getByText("Auto sync didn’t finish")).toBeVisible();
  await expect(page.getByText(/next time you open the app/)).toBeVisible();
  const before = await stored(page);
  expect(before.lastSyncedAt).toBeLessThan(Date.now() - DAY / 2);
  expect(before.autoFailedDay).not.toBeNull();

  await page.reload();
  await page.getByRole("link", { name: "Plan a khatm" }).waitFor();
  await page.waitForTimeout(800);
  await expect(page.getByText("Auto sync didn’t finish")).toHaveCount(0);
  expect(cloud.calls.filter((method) => method === "GET").length).toBe(2);
});

test("is switched on from the sync card once a first sync has happened, and stays on", async ({ page }) => {
  const cloud = fakeCloud();
  await cloud.attach(page.context());
  await seed(page, { auto: false, lastSyncedAt: null });
  await page.goto("/stats");
  const card = page.getByRole("region", { name: "Cloud sync" });
  const toggle = card.getByRole("switch", { name: "Sync automatically" });
  await expect(toggle).toBeDisabled();
  await expect(card.getByText("This can be turned on after your first sync.")).toBeVisible();

  await card.getByRole("button", { name: "Sync now" }).click();
  await expect(card.getByText(/^Last synced/).first()).toBeVisible();
  await expect(toggle).toBeEnabled();
  await toggle.click();
  await expect(toggle).toBeChecked();
  await page.reload();
  await expect(card.getByRole("switch", { name: "Sync automatically" })).toBeChecked();
});

test("turns itself off when the cloud data is deleted", async ({ page }) => {
  const cloud = fakeCloud();
  await cloud.attach(page.context());
  await seed(page, { lastSyncedAt: Date.now() - 60_000 });
  await page.goto("/stats");
  const card = page.getByRole("region", { name: "Cloud sync" });
  await card.getByRole("button", { name: "Sync now" }).click();
  await expect(card.getByRole("switch", { name: "Sync automatically" })).toBeChecked();
  await card.getByRole("button", { name: "Delete my cloud data" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
  await expect(card.getByText("Not synced yet").first()).toBeVisible();
  await expect(card.getByRole("switch", { name: "Sync automatically" })).not.toBeChecked();
  expect((await stored(page)).auto).toBe(false);
});

test("lists the devices that sync with the key, renames this one and removes another", async ({ page, browser }) => {
  const cloud = fakeCloud();
  await cloud.attach(page.context());
  const anHourAgo = Date.now() - 3_600_000;
  cloud.records.set(KEY, { version: 1, snapshot: blank({ laptop: { name: "Edge · Windows", syncedAt: anHourAgo, updatedAt: anHourAgo, removed: false } }) });
  await seed(page, { auto: false });
  await page.goto("/stats");
  const card = page.getByRole("region", { name: "Cloud sync" });
  const devices = card.getByRole("region", { name: "Devices using this code" });
  await expect(devices.getByText("Sync once and this device will appear here.")).toBeVisible();

  await card.getByRole("button", { name: "Sync now" }).click();
  await expect(devices.getByRole("listitem")).toHaveCount(2);
  const mine = devices.getByRole("listitem").filter({ hasText: "This device" });
  await expect(mine).toHaveCount(1);
  await expect(devices.getByRole("listitem").filter({ hasText: "Edge · Windows" })).toBeVisible();

  await mine.getByRole("button", { name: /^Rename/ }).click();
  const dialog = page.getByRole("dialog", { name: "Name this device" });
  await dialog.getByLabel("Device name").fill("Shahadot's phone");
  await dialog.getByRole("button", { name: "Save name" }).click();
  await expect(devices.getByText("Shahadot's phone")).toBeVisible();

  await devices.getByRole("button", { name: "Remove Edge · Windows from the list" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Remove" }).click();
  await expect(devices.getByRole("listitem")).toHaveCount(1);

  await card.getByRole("button", { name: "Sync now" }).click();
  const savedDevices = () => (cloud.records.get(KEY)!.snapshot as { devices: Record<string, { name: string; removed: boolean }> }).devices;
  await expect.poll(() => savedDevices()["this-device"]!.name).toBe("Shahadot's phone");
  expect(savedDevices().laptop!.removed).toBe(true);

  // Another browser using the same key sees the new name, and not the removed device.
  const other = await browser.newContext();
  await cloud.attach(other);
  const second = await other.newPage();
  await second.addInitScript((key) => {
    localStorage.setItem("qp-device-id", "second-device");
    localStorage.setItem("qp-sync", JSON.stringify({ version: 0, state: { key, lastSyncedAt: Date.now() - 1000, nudgeDismissedAt: null, auto: false, autoFailedDay: null, deviceName: null, devices: {} } }));
  }, KEY);
  await second.goto("/stats");
  const secondCard = second.getByRole("region", { name: "Cloud sync" });
  await secondCard.getByRole("button", { name: "Sync now" }).click();
  const secondDevices = secondCard.getByRole("region", { name: "Devices using this code" });
  await expect(secondDevices.getByRole("listitem")).toHaveCount(2);
  await expect(secondDevices.getByText("Shahadot's phone")).toBeVisible();
  await expect(secondDevices.getByText("Edge · Windows")).toHaveCount(0);
  await other.close();
});

test("reads in Bengali", async ({ page, context }) => {
  const cloud = fakeCloud();
  await cloud.attach(context);
  await context.addCookies([{ name: "NEXT_LOCALE", value: "bn", url: "http://localhost:3100" }]);
  await seed(page);
  await page.goto("/");
  await expect(page.getByText("নিজে থেকে সিঙ্ক হয়েছে")).toBeVisible();
  await page.goto("/stats");
  const card = page.getByRole("region", { name: "ক্লাউড সিঙ্ক" });
  await expect(card.getByRole("switch", { name: "নিজে থেকে সিঙ্ক করুন" })).toBeChecked();
  await expect(card.getByRole("region", { name: "যেসব ডিভাইস এই কোড ব্যবহার করছে" })).toBeVisible();
  await expect(page.locator("body")).not.toContainText("NaN");
});
