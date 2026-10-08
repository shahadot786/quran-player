import { expect, test, type Page } from "@playwright/test";
import { goToPage } from "./helpers";

// Two heard surahs (Al-Fatihah finished, Al-Baqarah half) plus an older finished round, written before the app loads.
async function seedProgress(page: Page, extra: Record<string, unknown> = {}) {
  await page.addInitScript((overrides) => {
    if (localStorage.getItem("e2e-seeded")) return;
    localStorage.setItem("e2e-seeded", "1");
    // The first `count` of a surah's 200 slices, in the app's saved format.
    const heard = (count: number) => {
      const out = new Uint8Array(25);
      for (let i = 0; i < count; i += 1) out[i >> 3]! |= 1 << (i & 7);
      return btoa(String.fromCharCode(...out)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    };
    localStorage.setItem(
      "qp-progress",
      JSON.stringify({
        version: 1,
        state: {
          slices: { 1: heard(200), 2: heard(100), 112: heard(200) },
          lifetime: {
            1: { seconds: 3600, completions: 3, lastAt: Date.now() - 3600_000, reciters: { 1: { name: "Mishary Alafasy", seconds: 3000 }, 2: { name: "Saad Al-Ghamdi", seconds: 600 } }, source: null },
            2: { seconds: 0, completions: 0, lastAt: Date.now() - 86_400_000, reciters: { 1: { name: "Mishary Alafasy", seconds: 0 } }, source: "resume" },
            112: { seconds: 120, completions: 1, lastAt: Date.now() - 7200_000, reciters: { 1: { name: "Mishary Alafasy", seconds: 120 } }, source: null },
          },
          rounds: [{ number: 1, startedAt: Date.now() - 40 * 86_400_000, finishedAt: Date.now() - 10 * 86_400_000, seconds: 36_000 }],
          currentRound: 2,
          roundStartedAt: Date.now() - 5 * 86_400_000,
          roundSeconds: 3720,
          paceSeconds: 1500,
          paceAyahs: 120,
          legacyImportedAt: Date.now() - 86_400_000,
          ...overrides,
        },
      }),
    );
    localStorage.setItem("qp-stats", JSON.stringify({ version: 0, state: { totalSeconds: 7200, daily: { "2026-10-01": 3600, "2026-10-02": 3600 }, reciters: {}, completed: {} } }));
  }, extra);
}

test("shows an empty start with a way into the player", async ({ page }) => {
  await page.goto("/progress");
  await expect(page.getByRole("heading", { name: "Quran progress" })).toBeVisible();
  await expect(page.getByText(/Start listening and your progress will build up here/)).toBeVisible();
  await page.getByRole("link", { name: "Open the player" }).click();
  await expect(page).toHaveURL(/\/player$/);
});

test("shows overview, paras, surahs and khatm history from saved progress", async ({ page }) => {
  await seedProgress(page);
  await page.goto("/progress");

  await expect(page.getByText("of the Quran heard")).toBeVisible();
  await expect(page.getByText("2 of 114")).toBeVisible();
  await expect(page.getByText("Round 2")).toBeVisible();
  await expect(page.getByText("1 completed")).toBeVisible();
  await expect(page.getByText("Estimated time left")).toBeVisible();

  const paras = page.getByRole("list").filter({ hasText: "Para 1" });
  await expect(paras.getByRole("heading", { name: "Para 30" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Para 1", exact: true }).first()).toBeVisible();

  await page.getByRole("tab", { name: "Surahs" }).click();
  await expect(page.getByRole("button", { name: /Surah 1, Al-Fatihah, Finished/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Surah 2, Al-Baqarah, 50% heard/ })).toBeVisible();
  await page.getByRole("tab", { name: /^Finished/ }).click();
  await expect(page.getByRole("button", { name: /Surah 1,/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Surah 2,/ })).toBeHidden();
  await page.getByRole("tab", { name: /^Not started/ }).click();
  await expect(page.getByRole("button", { name: /Surah 114,/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Surah 1,/ })).toBeHidden();

  await page.getByRole("tab", { name: "Khatm history" }).click();
  await expect(page.getByRole("heading", { name: "Khatm 1" })).toBeVisible();
});

test("opens a surah's details with a heat strip and its numbers", async ({ page }) => {
  await seedProgress(page);
  await page.goto("/progress");
  await page.getByRole("tab", { name: "Surahs" }).click();
  await page.getByRole("button", { name: /Surah 1, Al-Fatihah/ }).click();

  const sheet = page.getByRole("dialog");
  await expect(sheet.getByRole("heading", { name: "Al-Fatihah" })).toBeVisible();
  await expect(sheet.getByText("Finished", { exact: true }).first()).toBeVisible();
  await expect(sheet.getByRole("img", { name: /Which parts you have heard: 100%/ })).toBeVisible();
  await expect(sheet.getByText("Times finished")).toBeVisible();
  await expect(sheet.getByText("3", { exact: true })).toBeVisible();
  await expect(sheet.getByText("Mishary Alafasy")).toBeVisible();
  await expect(sheet.getByRole("link", { name: "Choose a reciter" })).toHaveAttribute("href", "/surahs/1");

  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
});

test("says where a half-heard surah came from", async ({ page }) => {
  await seedProgress(page);
  await page.goto("/progress");
  await page.getByRole("tab", { name: "Surahs" }).click();
  await page.getByRole("button", { name: /Surah 2, Al-Baqarah/ }).click();
  await expect(page.getByRole("dialog").getByText(/Counted from your earlier listening/)).toBeVisible();
  await expect(page.getByRole("dialog").getByText("Not tracked yet")).toBeVisible();
});

test("is reachable from the navigation on every screen size", async ({ page, isMobile }) => {
  await page.goto("/");
  await goToPage(page, isMobile, "Progress");
  await expect(page).toHaveURL(/\/progress$/);
  await goToPage(page, isMobile, "Stats");
  await expect(page).toHaveURL(/\/stats$/);
  await goToPage(page, isMobile, "Reciters");
  await expect(page).toHaveURL(/\/reciters$/);
});

test("agrees with the Stats page on how many surahs are completed", async ({ page }) => {
  await seedProgress(page);
  await page.goto("/stats");
  const tile = page.getByText("Surahs completed").locator("..");
  await expect(tile.getByText("2", { exact: true })).toBeVisible();
  await expect(tile.getByText("2 of 114 distinct surahs")).toBeVisible();
  await page.goto("/progress");
  await expect(page.getByText("2 of 114", { exact: true })).toBeVisible();
});

test("shows a summary on the player page that opens the full page", async ({ page }) => {
  await seedProgress(page);
  await page.goto("/player");
  const card = page.getByRole("region", { name: "Quran progress" });
  await expect(card).toBeVisible();
  await expect(card.getByText("1 of 30 paras · 2 of 114 surahs")).toBeVisible();
  await expect(card.getByRole("img", { name: "Progress across the 114 surahs" })).toBeVisible();
  await card.getByRole("link", { name: "View full progress" }).click();
  await expect(page).toHaveURL(/\/progress$/);
  await expect(page.getByRole("heading", { name: "Quran progress", level: 1 })).toBeVisible();
});

test("invites you to start when nothing has been heard", async ({ page }) => {
  await page.goto("/player");
  await expect(page.getByRole("region", { name: "Quran progress" }).getByText(/Start a surah and your progress will show here/)).toBeVisible();
});
