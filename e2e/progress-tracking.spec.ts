import { expect, test, type Page } from "@playwright/test";
import { mockAudio, mockQuranText } from "./helpers";

type SavedProgress = {
  slices: Record<string, string>;
  lifetime: Record<string, { seconds: number; completions: number; source: string | null }>;
  legacyImportedAt: number | null;
};

const heardSlices = (encoded: string | undefined) =>
  encoded ? [...Buffer.from(encoded, "base64url")].reduce((total, byte) => total + byte.toString(2).replace(/0/g, "").length, 0) : 0;

async function savedProgress(page: Page): Promise<SavedProgress> {
  const raw = await page.evaluate(() => localStorage.getItem("qp-progress"));
  return (JSON.parse(raw ?? "{}") as { state?: SavedProgress }).state ?? { slices: {}, lifetime: {}, legacyImportedAt: null };
}

// What someone who already used the app for a few days would have saved, written once before the app first loads.
async function seedEarlierListening(page: Page) {
  await page.addInitScript(() => {
    if (localStorage.getItem("e2e-seeded")) return;
    localStorage.setItem("e2e-seeded", "1");
    const track = (surah: number) => ({
      reciterId: 1, reciterName: "Mishary Alafasy", moshafId: 10, moshafName: "Hafs",
      server: "https://server.example/a/", padded: true, surah,
    });
    localStorage.setItem("qp-stats", JSON.stringify({ version: 0, state: {
      totalSeconds: 5400, daily: { "2026-10-01": 5400 }, reciters: { 1: { name: "Mishary Alafasy", seconds: 5400 } },
      completed: { "10:112": { surah: 112, reciterId: 1, count: 2, lastAt: 1790000000000 } },
    } }));
    localStorage.setItem("qp-player", JSON.stringify({ version: 0, state: {
      queue: [track(18)], index: 0,
      positions: { "10:18": { time: 300, duration: 1000, updatedAt: 1790100000000, track: track(18) } },
    } }));
  });
}

test.beforeEach(async ({ page }) => {
  await mockAudio(page);
  await mockQuranText(page);
});

test("records what was heard, keeps it across reloads, and imports earlier listening once", async ({ page }) => {
  await seedEarlierListening(page);
  await page.goto("/player");
  const player = page.getByRole("region", { name: "Audio player" });
  await expect(player.getByRole("button", { name: "Change reciter" })).toBeVisible();

  await expect.poll(async () => (await savedProgress(page)).legacyImportedAt).not.toBeNull();
  const imported = await savedProgress(page);
  expect(heardSlices(imported.slices["112"])).toBe(200);
  expect(heardSlices(imported.slices["18"])).toBe(60);
  expect(imported.lifetime["112"]).toMatchObject({ completions: 2, source: "finished" });
  expect(imported.lifetime["18"]?.source).toBe("resume");

  await player.getByRole("button", { name: "Play all 114 surahs" }).click();
  await expect(player.getByText("Surah 1 of 114")).toBeVisible();
  await expect(player.getByText(/^0:0[6-9]$|^0:1\d$/).first()).toBeVisible({ timeout: 15000 });
  await player.getByRole("button", { name: "Pause", exact: true }).click();
  await expect(player.getByRole("button", { name: "Play", exact: true })).toBeVisible();

  const played = await savedProgress(page);
  const slices = heardSlices(played.slices["1"]);
  expect(slices).toBeGreaterThanOrEqual(8);
  expect(slices).toBeLessThanOrEqual(40);
  expect(played.lifetime["1"]!.seconds).toBeGreaterThan(4);
  expect(played.legacyImportedAt).toBe(imported.legacyImportedAt);

  await page.reload();
  await expect(player.getByRole("button", { name: "Change reciter" })).toBeVisible();
  const reloaded = await savedProgress(page);
  expect(heardSlices(reloaded.slices["1"])).toBe(slices);
  expect(heardSlices(reloaded.slices["112"])).toBe(200);
  expect(reloaded.legacyImportedAt).toBe(imported.legacyImportedAt);
});

test("does not count a jump to the end of a surah as listening", async ({ page }) => {
  await page.goto("/player");
  const player = page.getByRole("region", { name: "Audio player" });
  await player.getByRole("button", { name: "Play all 114 surahs" }).click();
  await expect(player.getByText("Surah 1 of 114")).toBeVisible();
  await expect(player.getByText("2:00")).toBeVisible();

  const seek = player.getByRole("slider", { name: "Seek" });
  await seek.focus();
  await seek.press("End");
  await expect(player.getByText("Surah 2 of 114")).toBeVisible();

  const progress = await savedProgress(page);
  expect(heardSlices(progress.slices["1"])).toBeLessThan(40);
});
