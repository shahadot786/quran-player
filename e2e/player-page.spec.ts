import { expect, test } from "@playwright/test";
import { mockAudio } from "./helpers";

test.beforeEach(async ({ page }) => {
  await mockAudio(page);
});

test("plays all 114 surahs from the player page", async ({ page }) => {
  await page.goto("/player");
  const player = page.getByRole("region", { name: "Audio player" });
  await expect(player.getByText(/Nothing is playing yet/)).toBeVisible();
  await expect(player.getByRole("button", { name: "Change reciter" })).toContainText("Mishary Alafasi");

  await player.getByRole("button", { name: "Play all 114 surahs" }).click();
  await expect(player.getByText("Surah 1 of 114")).toBeVisible();
  await expect(player.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  await expect(player.getByText("Up next: Al-Baqarah")).toBeVisible();
  await expect(player.getByRole("switch")).toBeChecked();

  await page.getByRole("tab", { name: "Queue" }).click();
  await expect(page.getByText("114 surahs in the queue")).toBeVisible();

  await player.getByRole("button", { name: "Next surah" }).click();
  await expect(player.getByText("Surah 2 of 114")).toBeVisible();
});

test("switches reciter and keeps the surah", async ({ page }) => {
  await page.goto("/player");
  const player = page.getByRole("region", { name: "Audio player" });
  await player.getByRole("button", { name: "Play all 114 surahs" }).click();
  await player.getByRole("button", { name: "Next surah" }).click();
  await expect(player.getByText("Surah 2 of 114")).toBeVisible();

  await player.getByRole("button", { name: "Change reciter" }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByPlaceholder("Search reciters").fill("shuraim");
  await dialog.getByRole("option").first().click();

  await expect(player.getByRole("button", { name: "Change reciter" })).toContainText(/Shuraim/i);
  await expect(player.getByText("Surah 2 of 114")).toBeVisible();
  await expect(player.getByRole("link", { name: /Shuraim/i })).toBeVisible();
});

test("jumps to a surah from the list and loops a passage", async ({ page }) => {
  await page.goto("/player");
  await page.getByRole("searchbox", { name: "Filter surahs" }).fill("ya-sin");
  await page.getByRole("button", { name: "Play Ya-Sin" }).click();
  const player = page.getByRole("region", { name: "Audio player" });
  await expect(player.getByText("Surah 36 of 114")).toBeVisible();

  const seek = player.getByRole("slider", { name: "Seek" });
  await seek.focus();
  await seek.press("Home");
  await player.getByRole("button", { name: "Set start" }).click();
  await expect(player.getByRole("button", { name: /^Start 0:0\d$/ })).toBeVisible();
  await seek.press("PageUp");
  await player.getByRole("button", { name: "Set end" }).click();
  await expect(player.getByText(/^Repeating 0:0\d to 0:1\d$/)).toBeVisible();

  await seek.press("PageUp");
  await expect(player.getByText(/^0:0\d$/)).toBeVisible();

  await player.getByRole("button", { name: "Clear loop" }).click();
  await expect(player.getByRole("button", { name: "Set start" })).toBeVisible();
});

test("reorders and trims the queue", async ({ page }) => {
  await page.goto("/player");
  const player = page.getByRole("region", { name: "Audio player" });
  await player.getByRole("button", { name: "Play all 114 surahs" }).click();
  await page.getByRole("tab", { name: "Queue" }).click();

  await page.getByRole("button", { name: "Move Al-Baqarah down" }).click();
  await expect(player.getByText("Up next: Ali 'Imran")).toBeVisible();
  await page.getByRole("button", { name: "Remove Ali 'Imran from queue" }).click();
  await expect(player.getByText("Up next: Al-Baqarah")).toBeVisible();
  await expect(page.getByText("113 surahs in the queue")).toBeVisible();

  await page.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(page.getByText("1 surah in the queue")).toBeVisible();
  await expect(player.getByText("Last surah in the queue")).toBeVisible();
});
