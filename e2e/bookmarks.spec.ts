import { expect, test, type Page } from "@playwright/test";
import { fatihaTimings, mockAudio, mockQuranText } from "./helpers";

async function startFatiha(page: Page) {
  await mockAudio(page);
  await mockQuranText(page);
  await page.route("**/api/timings?*", (route) => route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(fatihaTimings()) }));
  await page.goto("/player");
  const player = page.getByRole("region", { name: "Audio player" });
  await player.getByRole("button", { name: "Play all 114 surahs" }).click();
  await expect(player.getByText("Surah 1 of 114")).toBeVisible();
  await page.getByRole("tab", { name: "Live Quran" }).click();
}

const ayah = (page: Page, number: number) => page.locator(`[data-ayah="${number}"]`);

test("bookmarks an ayah, adds a note, lists both in the library, and opens one again", async ({ page }) => {
  await startFatiha(page);
  const bookmark3 = page.getByRole("button", { name: "Bookmark Al-Fatihah, ayah 3" });
  await bookmark3.click();
  await expect(bookmark3).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: "Note for Al-Fatihah, ayah 5" }).click();
  const dialog = page.getByRole("dialog", { name: "Note for Al-Fatihah, ayah 5" });
  await dialog.getByLabel("Note").fill("Revise before Jumuah");
  await dialog.getByRole("button", { name: "Save note" }).click();
  await expect(ayah(page, 5).getByText("Revise before Jumuah")).toBeVisible();

  await page.reload();
  await page.getByRole("tab", { name: "Live Quran" }).click();
  await expect(page.getByRole("button", { name: "Bookmark Al-Fatihah, ayah 3" })).toHaveAttribute("aria-pressed", "true");

  await page.goto("/library?tab=bookmarks");
  const list = page.getByRole("tabpanel", { name: "Bookmarks" });
  await expect(list.getByRole("heading", { name: "Al-Fatihah, ayah 5" })).toBeVisible();
  await expect(list.getByText("Revise before Jumuah")).toBeVisible();
  await expect(list.getByRole("heading", { name: "Al-Fatihah, ayah 3" })).toBeVisible();

  await list.getByRole("button", { name: "Play Al-Fatihah, ayah 5" }).click();
  await expect(page).toHaveURL(/\/player$/);
  await expect(ayah(page, 5)).toBeFocused();
});

test("removes a bookmark from the library and can undo it", async ({ page }) => {
  await startFatiha(page);
  await page.getByRole("button", { name: "Bookmark Al-Fatihah, ayah 2" }).click();
  await page.goto("/library?tab=bookmarks");
  const list = page.getByRole("tabpanel", { name: "Bookmarks" });
  await list.getByRole("button", { name: "Remove Al-Fatihah, ayah 2" }).click();
  await expect(list.getByText(/Bookmark an ayah in Live Quran/)).toBeVisible();
  await page.getByRole("button", { name: "Undo" }).click();
  await expect(list.getByRole("heading", { name: "Al-Fatihah, ayah 2" })).toBeVisible();
});
