import { expect, test } from "@playwright/test";
import { mockAudio, openPlayer, playFirstSurah } from "./helpers";

test("plays, seeks and resumes after a reload", async ({ page, isMobile }) => {
  await mockAudio(page);
  await page.goto("/reciters/123");
  const surah = await playFirstSurah(page);

  let player = await openPlayer(page, isMobile);
  await expect(player.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  await expect(player.getByText("2:00")).toBeVisible();

  const seek = player.getByRole("slider", { name: "Seek" });
  await seek.focus();
  for (let i = 0; i < 6; i += 1) await seek.press("PageUp");
  await expect(player.getByText(/^1:0\d$/).first()).toBeVisible();

  await player.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(player.getByRole("button", { name: "Play", exact: true })).toBeVisible();

  await page.reload();
  player = await openPlayer(page, isMobile);
  await expect(player.getByRole("button", { name: "Play", exact: true })).toBeVisible();
  await expect(player.getByText(/^1:0\d$/).first()).toBeVisible();

  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Continue listening" })).toBeVisible();
  await expect(page.getByRole("link", { name: surah, exact: true })).toBeVisible();
});

test("keeps playing while navigating between pages", async ({ page }) => {
  await mockAudio(page);
  await page.goto("/reciters/123");
  await playFirstSurah(page);
  await expect(page.getByRole("button", { name: "Pause", exact: true }).first()).toBeVisible();
  await page.getByRole("link", { name: "Surahs", exact: true }).click();
  await expect(page).toHaveURL(/\/surahs$/);
  await expect(page.getByRole("button", { name: "Pause", exact: true }).first()).toBeVisible();
});
