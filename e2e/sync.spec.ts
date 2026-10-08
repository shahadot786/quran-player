import { expect, test, type BrowserContext, type Page } from "@playwright/test";

type Remote = { version: number; snapshot: unknown };

// Stands in for /api/sync so these tests need no database; it keeps a version per key like the real endpoints.
function fakeCloud() {
  const records = new Map<string, Remote>();
  const calls: string[] = [];
  let failWith: number | "abort" | null = null;
  return {
    records,
    calls,
    fail: (status: number | "abort" | null) => (failWith = status),
    async attach(context: BrowserContext) {
      await context.route("**/api/sync", async (route) => {
        const request = route.request();
        const key = (request.headers()["authorization"] ?? "").replace("Bearer ", "");
        calls.push(request.method());
        if (failWith === "abort") return route.abort("failed");
        if (failWith) return route.fulfill({ status: failWith, headers: { "Retry-After": "60" }, json: {} });
        const record = records.get(key);
        if (request.method() === "GET") return record ? route.fulfill({ json: record }) : route.fulfill({ status: 404, json: {} });
        if (request.method() === "DELETE") {
          records.delete(key);
          return route.fulfill({ status: 204 });
        }
        const body = request.postDataJSON() as { baseVersion: number; snapshot: unknown };
        if ((record?.version ?? 0) !== body.baseVersion) return route.fulfill({ status: 409, json: record ?? { version: 0, snapshot: null } });
        const version = body.baseVersion + 1;
        records.set(key, { version, snapshot: body.snapshot });
        return route.fulfill({ json: { version } });
      });
    },
  };
}

async function seedDay(page: Page, day: string, seconds: number) {
  await page.addInitScript(
    ({ day, seconds }) => {
      if (localStorage.getItem("e2e-seeded")) return;
      localStorage.setItem("e2e-seeded", "1");
      localStorage.setItem("qp-stats", JSON.stringify({ version: 0, state: { totalSeconds: seconds, daily: { [day]: seconds }, reciters: {}, completed: {} } }));
    },
    { day, seconds },
  );
}

const storedDaily = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem("qp-stats")!).state.daily as Record<string, number>);
const storedKey = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem("qp-sync")!).state.key as string);

async function openSync(page: Page) {
  await page.goto("/stats");
  const card = page.getByRole("region", { name: "Cloud sync" });
  await expect(card.getByRole("button", { name: "Sync now" })).toBeEnabled();
  return card;
}

test("makes a key on the first visit, keeps it hidden until asked, and uploads only on Sync", async ({ page }) => {
  const cloud = fakeCloud();
  await cloud.attach(page.context());
  await seedDay(page, "2026-10-01", 60);
  const card = await openSync(page);

  await expect(card.getByText("Not synced yet")).toBeVisible();
  const key = await storedKey(page);
  expect(key).toMatch(/^[a-z]{3,8}(-[a-z]{3,8}){7}$/);
  await expect(card.getByText(key)).toHaveCount(0);
  await card.getByRole("button", { name: "Show key" }).click();
  await expect(card.getByText(key)).toBeVisible();
  await card.getByRole("button", { name: "Hide key" }).click();
  expect(cloud.calls).toEqual([]);

  await card.getByRole("button", { name: "Sync now" }).click();
  await expect(card.getByText(/^Last synced/)).toBeVisible();
  expect(cloud.calls).toEqual(["GET", "PUT"]);
  expect(cloud.records.get(key)).toBeDefined();

  await page.reload();
  expect(await storedKey(page)).toBe(key);
});

test("a second device restores from the key, and both end up with everything", async ({ browser }) => {
  const cloud = fakeCloud();
  const phoneContext = await browser.newContext();
  const laptopContext = await browser.newContext();
  await cloud.attach(phoneContext);
  await cloud.attach(laptopContext);
  const phone = await phoneContext.newPage();
  const laptop = await laptopContext.newPage();
  await seedDay(phone, "2026-10-01", 60);
  await seedDay(laptop, "2026-10-02", 30);

  const phoneCard = await openSync(phone);
  await phoneCard.getByRole("button", { name: "Sync now" }).click();
  await expect(phoneCard.getByText(/^Last synced/)).toBeVisible();
  const key = await storedKey(phone);

  const laptopCard = await openSync(laptop);
  await laptopCard.getByRole("button", { name: "Restore from key" }).click();
  const dialog = laptop.getByRole("dialog", { name: "Restore from a key" });
  await dialog.getByLabel("Sync key").fill(` ${key} `);
  await dialog.getByRole("button", { name: "Restore", exact: true }).click();
  await expect(dialog).toBeHidden();
  expect(await storedDaily(laptop)).toEqual({ "2026-10-01": 60, "2026-10-02": 30 });
  expect(await storedKey(laptop)).toBe(key);

  await phoneCard.getByRole("button", { name: "Sync now" }).click();
  await expect(phoneCard.getByText(/^Last synced/)).toBeVisible();
  await expect.poll(() => storedDaily(phone)).toEqual({ "2026-10-01": 60, "2026-10-02": 30 });
  await phoneContext.close();
  await laptopContext.close();
});

test("says what went wrong and keeps the data when the key is wrong, the network is down or limits are hit", async ({ page }) => {
  const cloud = fakeCloud();
  await cloud.attach(page.context());
  await seedDay(page, "2026-10-01", 60);
  const card = await openSync(page);

  await card.getByRole("button", { name: "Restore from key" }).click();
  const dialog = page.getByRole("dialog", { name: "Restore from a key" });
  await dialog.getByLabel("Sync key").fill("nonsense");
  await dialog.getByRole("button", { name: "Restore", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("That isn’t a valid sync key.");
  await dialog.getByLabel("Sync key").fill("abandon-ability-able-about-above-absent-absorb-abstract");
  await dialog.getByRole("button", { name: "Restore", exact: true }).click();
  await expect(dialog.getByRole("alert")).toHaveText("There is no cloud data for that key.");
  await dialog.getByRole("button", { name: "Cancel" }).click();

  cloud.fail("abort");
  await card.getByRole("button", { name: "Sync now" }).click();
  await expect(page.getByText(/You’re offline/).first()).toBeVisible();
  cloud.fail(429);
  await card.getByRole("button", { name: "Sync now" }).click();
  await expect(page.getByText("Too many requests. Try again in a few minutes.").first()).toBeVisible();

  expect(await storedDaily(page)).toEqual({ "2026-10-01": 60 });
  await expect(card.getByText("Not synced yet")).toBeVisible();
});

test("deletes the cloud copy after confirmation and keeps the data on the device", async ({ page }) => {
  const cloud = fakeCloud();
  await cloud.attach(page.context());
  await seedDay(page, "2026-10-01", 60);
  const card = await openSync(page);
  await card.getByRole("button", { name: "Sync now" }).click();
  await expect(card.getByText(/^Last synced/)).toBeVisible();
  expect(cloud.records.size).toBe(1);

  await card.getByRole("button", { name: "Delete my cloud data" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
  await expect(card.getByText("Not synced yet")).toBeVisible();
  expect(cloud.records.size).toBe(0);
  expect(await storedDaily(page)).toEqual({ "2026-10-01": 60 });
});
