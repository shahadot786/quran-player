import { expect, test, type Page } from "@playwright/test";
import { fakeCloud } from "./fake-cloud";

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

test("makes a code on the first visit, keeps it hidden until asked, and uploads only on Sync", async ({ page }) => {
  const cloud = fakeCloud();
  await cloud.attach(page.context());
  await seedDay(page, "2026-10-01", 60);
  const card = await openSync(page);

  await expect(card.getByText("Not synced yet").first()).toBeVisible();
  const key = await storedKey(page);
  expect(key).toMatch(/^[a-z]+(-[a-z]+){3}-\d{2}$/);
  await expect(card.getByText(key.replace(/-/g, " "))).toHaveCount(0);
  await card.getByRole("button", { name: "Show code" }).click();
  await expect(card.getByText(key.replace(/-/g, " "))).toBeVisible();
  await card.getByRole("button", { name: "Hide code" }).click();
  expect(cloud.calls).toEqual([]);

  await card.getByRole("button", { name: "Sync now" }).click();
  await expect(card.getByText(/^Last synced/).first()).toBeVisible();
  expect(cloud.calls).toEqual(["GET", "PUT"]);
  // The words never leave the device: the cloud knows the code only as a long derived token.
  expect([...cloud.records.keys()]).toHaveLength(1);
  expect([...cloud.records.keys()][0]).toMatch(/^[A-Za-z0-9_-]{43}$/);
  expect([...cloud.records.keys()][0]).not.toContain(key.split("-")[0]!);

  await page.reload();
  expect(await storedKey(page)).toBe(key);
});

test("a second device restores from the code, and both end up with everything", async ({ browser }) => {
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
  await expect(phoneCard.getByText(/^Last synced/).first()).toBeVisible();
  const key = await storedKey(phone);

  const laptopCard = await openSync(laptop);
  await laptopCard.getByRole("button", { name: "Restore from code" }).click();
  const dialog = laptop.getByRole("dialog", { name: "Restore from a code" });
  await dialog.getByLabel("Sync code").fill(` ${key} `);
  await dialog.getByRole("button", { name: "Restore", exact: true }).click();
  await expect(dialog).toBeHidden();
  expect(await storedDaily(laptop)).toEqual({ "2026-10-01": 60, "2026-10-02": 30 });
  expect(await storedKey(laptop)).toBe(key);

  await phoneCard.getByRole("button", { name: "Sync now" }).click();
  await expect(phoneCard.getByText(/^Last synced/).first()).toBeVisible();
  await expect.poll(() => storedDaily(phone)).toEqual({ "2026-10-01": 60, "2026-10-02": 30 });
  await phoneContext.close();
  await laptopContext.close();
});

test("says what went wrong and keeps the data when the code is wrong, the network is down or limits are hit", async ({ page }) => {
  const cloud = fakeCloud();
  await cloud.attach(page.context());
  await seedDay(page, "2026-10-01", 60);
  const card = await openSync(page);

  await card.getByRole("button", { name: "Restore from code" }).click();
  const dialog = page.getByRole("dialog", { name: "Restore from a code" });
  await dialog.getByLabel("Sync code").fill("nonsense");
  await dialog.getByRole("button", { name: "Restore", exact: true }).click();
  await expect(dialog.getByRole("alert")).toContainText("That isn’t a valid sync code.");
  await dialog.getByLabel("Sync code").fill("7 quiet golden camels slowly stroll past the sunny river at dawn");
  await dialog.getByRole("button", { name: "Restore", exact: true }).click();
  await expect(dialog.getByRole("alert")).toHaveText("There is no cloud data for that code.");
  await dialog.getByRole("button", { name: "Cancel" }).click();

  cloud.fail("abort");
  await card.getByRole("button", { name: "Sync now" }).click();
  await expect(page.getByText(/You’re offline/).first()).toBeVisible();
  cloud.fail(429);
  await card.getByRole("button", { name: "Sync now" }).click();
  await expect(page.getByText("Too many requests. Try again in a few minutes.").first()).toBeVisible();

  expect(await storedDaily(page)).toEqual({ "2026-10-01": 60 });
  await expect(card.getByText("Not synced yet").first()).toBeVisible();
});

test("deletes the cloud copy after confirmation and keeps the data on the device", async ({ page }) => {
  const cloud = fakeCloud();
  await cloud.attach(page.context());
  await seedDay(page, "2026-10-01", 60);
  const card = await openSync(page);
  await card.getByRole("button", { name: "Sync now" }).click();
  await expect(card.getByText(/^Last synced/).first()).toBeVisible();
  expect(cloud.records.size).toBe(1);

  await card.getByRole("button", { name: "Delete my cloud data" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
  await expect(card.getByText("Not synced yet").first()).toBeVisible();
  expect(cloud.records.size).toBe(0);
  expect(await storedDaily(page)).toEqual({ "2026-10-01": 60 });
});

test("saves the code as a text file with how to use it", async ({ page }) => {
  await seedDay(page, "2026-10-01", 60);
  const card = await openSync(page);
  const key = await storedKey(page);
  const download = page.waitForEvent("download");
  await card.getByRole("button", { name: "Save as file" }).click();
  const file = await download;
  expect(file.suggestedFilename()).toBe("tilawah-sync-key.txt");
  const { readFile } = await import("node:fs/promises");
  const text = await readFile((await file.path())!, "utf8");
  expect(text).toContain(key.replace(/-/g, " "));
  expect(text).toContain("Restore from code");
});

const LONG_KEY = "7-quiet-golden-camels-slowly-stroll-past-the-sunny-river-at-dawn";

async function seedLegacyKey(page: Page) {
  await page.addInitScript((key) => {
    if (localStorage.getItem("e2e-seeded")) return;
    localStorage.setItem("e2e-seeded", "1");
    localStorage.setItem("qp-sync", JSON.stringify({ version: 0, state: { key, lastSyncedAt: null, nudgeDismissedAt: null, auto: false, autoFailedDay: null, deviceName: null, devices: {} } }));
  }, LONG_KEY);
}

test("suggests a short code, and moves the cloud copy to the one you choose", async ({ page }) => {
  const cloud = fakeCloud();
  await cloud.attach(page.context());
  await seedDay(page, "2026-10-01", 60);
  const card = await openSync(page);
  await card.getByRole("button", { name: "Sync now" }).click();
  await expect(card.getByText(/^Last synced/).first()).toBeVisible();
  const oldToken = [...cloud.records.keys()][0]!;

  await card.getByRole("button", { name: "Change code" }).click();
  const dialog = page.getByRole("dialog", { name: "Change your sync code" });
  const field = dialog.getByLabel("New sync code");
  await expect(field).toHaveValue(/^[a-z]+( [a-z]+){3} \d{2}$/);
  const first = await field.inputValue();
  await dialog.getByRole("button", { name: "Suggest another" }).click();
  await expect(field).not.toHaveValue(first);

  await field.fill("my dog rex");
  await expect(dialog.getByText("Use at least four words.")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Use this code" })).toBeDisabled();

  await field.fill("My dog Rex loves long walks 2020");
  await dialog.getByRole("button", { name: "Use this code" }).click();
  await expect(dialog).toBeHidden();
  expect(await storedKey(page)).toBe("my-dog-rex-loves-long-walks-2020");
  await expect.poll(() => [...cloud.records.keys()]).toHaveLength(1);
  expect([...cloud.records.keys()][0]).not.toBe(oldToken);
  await card.getByRole("button", { name: "Show code" }).click();
  await expect(card.getByText("my dog rex loves long walks 2020")).toBeVisible();
});

test("says so when the code is already in use, and changes nothing", async ({ browser, page }) => {
  const cloud = fakeCloud();
  await cloud.attach(page.context());
  await seedDay(page, "2026-10-01", 60);

  const other = await browser.newContext();
  await cloud.attach(other);
  const second = await other.newPage();
  const secondCard = await openSync(second);
  await secondCard.getByRole("button", { name: "Sync now" }).click();
  await expect(secondCard.getByText(/^Last synced/).first()).toBeVisible();
  const takenCode = (await storedKey(second)).replace(/-/g, " ");
  await other.close();

  const card = await openSync(page);
  const mine = await storedKey(page);
  await card.getByRole("button", { name: "Change code" }).click();
  const dialog = page.getByRole("dialog", { name: "Change your sync code" });
  await dialog.getByLabel("New sync code").fill(takenCode);
  await dialog.getByRole("button", { name: "Use this code" }).click();
  await expect(dialog.getByRole("alert")).toHaveText("That code is already in use. Try another one.");
  expect(await storedKey(page)).toBe(mine);
});

test("offers an easier code to someone who has a long key, and moves their copy", async ({ page }) => {
  const cloud = fakeCloud();
  await cloud.attach(page.context());
  await seedLegacyKey(page);
  await seedDay(page, "2026-10-01", 60);
  const card = await openSync(page);
  await expect(card.getByText("Your sync code is long")).toBeVisible();
  await card.getByRole("button", { name: "Sync now" }).click();
  await expect(card.getByText(/^Last synced/).first()).toBeVisible();
  expect([...cloud.records.keys()]).toEqual([LONG_KEY]);

  await card.getByRole("button", { name: "Use an easier code" }).click();
  const dialog = page.getByRole("dialog", { name: "Change your sync code" });
  await dialog.getByRole("button", { name: "Use this code" }).click();
  await expect(dialog).toBeHidden();
  await expect(card.getByText("Your sync code is long")).toHaveCount(0);
  expect(await storedKey(page)).toMatch(/^[a-z]+(-[a-z]+){3}-\d{2}$/);
  await expect.poll(() => [...cloud.records.keys()]).toHaveLength(1);
  expect(cloud.records.has(LONG_KEY)).toBe(false);
});

test("opens the restore form with the code filled in from a link, and keeps the code out of the address", async ({ page }) => {
  const cloud = fakeCloud();
  await cloud.attach(page.context());
  await page.goto("/stats#code=lunar%20pizza%20tiger%20cabin%2042");
  const dialog = page.getByRole("dialog", { name: "Restore from a code" });
  await expect(dialog.getByLabel("Sync code")).toHaveValue("lunar pizza tiger cabin 42");
  expect(page.url()).not.toContain("lunar");
});

test("copies a link that fills in the code on another device", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium", "clipboard permissions differ");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  const cloud = fakeCloud();
  await cloud.attach(context);
  const card = await openSync(page);
  const code = await storedKey(page);
  await card.getByRole("button", { name: "Copy link" }).click();
  const link = await page.evaluate(() => navigator.clipboard.readText());
  expect(link).toContain("/stats#code=");
  expect(decodeURIComponent(link.split("#code=")[1]!)).toBe(code.replace(/-/g, " "));
});
