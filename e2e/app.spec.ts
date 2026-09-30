import { expect, test } from "@playwright/test";

test("switches to dark theme and remembers it", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Change theme" }).click();
  await page.getByRole("menuitemradio", { name: "Dark" }).click();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator("html")).toHaveClass(/dark/);
  await page.getByRole("button", { name: "Change theme" }).click();
  await page.getByRole("menuitemradio", { name: "Light" }).click();
  await expect(page.locator("html")).not.toHaveClass(/dark/);
});

test("creates a playlist that survives a reload", async ({ page }) => {
  await page.goto("/library");
  await page.getByRole("tab", { name: "Playlists" }).click();
  await page.getByRole("button", { name: "New playlist" }).click();
  await page.getByLabel("Playlist name").fill("Friday listening");
  await page.getByRole("button", { name: "Create playlist" }).click();
  await expect(page.getByRole("heading", { name: "Friday listening" })).toBeVisible();

  await page.reload();
  await page.getByRole("tab", { name: "Playlists" }).click();
  await expect(page.getByRole("heading", { name: "Friday listening" })).toBeVisible();
});

test("shows empty stats and the data controls", async ({ page }) => {
  await page.goto("/stats");
  await expect(page.getByRole("heading", { name: "Listening stats" })).toBeVisible();
  await expect(page.getByText("Start a surah and your listening time will show up here.").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Export backup" })).toBeVisible();
  await page.getByRole("button", { name: "Reset all data" }).click();
  await expect(page.getByRole("alertdialog")).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
});

test("fits the viewport on every page without sideways scrolling", async ({ page, isMobile }) => {
  for (const path of ["/", "/reciters", "/surahs", "/library", "/stats"]) {
    await page.goto(path);
    await expect(page.getByRole("main")).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${path} overflows horizontally`).toBeLessThanOrEqual(0);
  }
  const nav = page.getByRole("navigation", { name: "Main navigation" });
  await expect(nav).toBeVisible();
  const box = await nav.boundingBox();
  if (isMobile) expect(box!.y).toBeGreaterThan(page.viewportSize()!.height / 2);
  else expect(box!.x).toBeLessThan(page.viewportSize()!.width / 4);
});

test("exports a backup file", async ({ page }) => {
  await page.goto("/stats");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export backup" }).click();
  expect((await download).suggestedFilename()).toMatch(/^tilawah-backup-\d{4}-\d{2}-\d{2}\.json$/);
});
