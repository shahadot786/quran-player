import { expect, test, type Page } from "@playwright/test";
import { fatihaTimings, mockAudio, mockQuranText } from "./helpers";

async function startFatiha(page: Page, timings: { status: number; body?: unknown }) {
  await mockAudio(page);
  await mockQuranText(page);
  await page.route("**/api/timings?*", (route) =>
    route.fulfill({ status: timings.status, contentType: "application/json", body: JSON.stringify(timings.body ?? null) }),
  );
  await page.goto("/player");
  const player = page.getByRole("region", { name: "Audio player" });
  await player.getByRole("button", { name: "Play all 114 surahs" }).click();
  await expect(player.getByText("Surah 1 of 114")).toBeVisible();
  await page.getByRole("tab", { name: "Live Quran" }).click();
  return player;
}

const ayah = (page: Page, number: number) => page.locator(`[data-ayah="${number}"]`);

test("highlights the ayah being recited and follows seeks", async ({ page }) => {
  const player = await startFatiha(page, { status: 200, body: fatihaTimings() });
  await expect(page.getByText("Following the recitation ayah by ayah")).toBeVisible();
  await expect(ayah(page, 1)).toHaveAttribute("aria-current", "true");

  const seek = player.getByRole("slider", { name: "Seek" });
  await seek.focus();
  for (let i = 0; i < 5; i += 1) await seek.press("PageUp");
  await expect(ayah(page, 3)).toHaveAttribute("aria-current", "true");
  await expect(ayah(page, 1)).not.toHaveAttribute("aria-current", "true");

  for (let i = 0; i < 5; i += 1) await seek.press("PageUp");
  await expect(ayah(page, 6)).toHaveAttribute("aria-current", "true");
  await expect(page.locator('[aria-current="true"][data-ayah]')).toHaveCount(1);
});

test("plays from a chosen ayah", async ({ page }) => {
  const player = await startFatiha(page, { status: 200, body: fatihaTimings() });
  await page.getByRole("button", { name: "Play from ayah 5" }).click();
  await expect(ayah(page, 5)).toHaveAttribute("aria-current", "true");
  await expect(player.getByText(/^1:0[89]$|^1:1\d$/).first()).toBeVisible();
  await expect(player.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
});

test("says so when a recitation has no timings", async ({ page }) => {
  await startFatiha(page, { status: 404 });
  await expect(page.getByText(/Ayah-by-ayah sync isn’t available/)).toBeVisible();
  await expect(page.locator('[data-ayah][aria-current="true"]')).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Play from ayah/ })).toHaveCount(0);
  await expect(ayah(page, 1)).toBeVisible();
});

test("refuses timings that don't match the audio length", async ({ page }) => {
  await startFatiha(page, { status: 200, body: fatihaTimings(70) });
  await expect(page.getByText(/Ayah-by-ayah sync isn’t available/)).toBeVisible();
  await expect(page.locator('[data-ayah][aria-current="true"]')).toHaveCount(0);
});

test("offers a synced-only filter when choosing a reciter", async ({ page }) => {
  await page.goto("/player");
  await page.getByRole("button", { name: "Change reciter" }).click();
  const dialog = page.getByRole("dialog");
  const all = await dialog.getByRole("option").count();
  await dialog.getByRole("switch").click();
  const synced = await dialog.getByRole("option").count();
  expect(synced).toBeGreaterThan(0);
  expect(synced).toBeLessThan(all);
  await expect(dialog.getByRole("option").first()).toContainText("Synced");
});

test("switches ayah within a fraction of a second of the boundary while playing", async ({ page }) => {
  const BOUNDARY_SECONDS = 2;
  await page.addInitScript(() => {
    const play = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
      (window as unknown as { __audio: HTMLMediaElement }).__audio = this;
      return play.call(this);
    };
  });
  // Six two-second ayahs, then a long seventh that fills the rest of the clip.
  const ayahs = Array.from({ length: 7 }, (_, i) => ({
    ayah: i + 1,
    start: i * BOUNDARY_SECONDS,
    end: i < 6 ? (i + 1) * BOUNDARY_SECONDS : 120,
  }));
  const player = await startFatiha(page, { status: 200, body: { preamble: null, ayahs } });
  await page.evaluate(() => {
    const w = window as unknown as { __changes: { ayah: number; time: number }[]; __audio: HTMLMediaElement };
    w.__changes = [];
    new MutationObserver(() => {
      const active = document.querySelector<HTMLElement>('[data-ayah][aria-current="true"]');
      if (active) w.__changes.push({ ayah: Number(active.dataset.ayah), time: w.__audio.currentTime });
    }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ["aria-current"] });
  });

  await expect(ayah(page, 5)).toHaveAttribute("aria-current", "true", { timeout: 15000 });
  await expect(player.getByRole("button", { name: "Pause", exact: true })).toBeVisible();

  const changes = await page.evaluate(() => (window as unknown as { __changes: { ayah: number; time: number }[] }).__changes);
  const transitions = changes.filter((change) => change.ayah >= 2);
  expect(transitions.map((change) => change.ayah)).toEqual([2, 3, 4, 5]);
  for (const { ayah: number, time } of transitions) {
    const lag = time - (number - 1) * BOUNDARY_SECONDS;
    expect(lag, `ayah ${number} switched ${lag.toFixed(3)}s after its boundary`).toBeGreaterThanOrEqual(-0.05);
    expect(lag, `ayah ${number} switched ${lag.toFixed(3)}s after its boundary`).toBeLessThan(0.2);
  }
});
