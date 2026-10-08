import { expect, test, type Page } from "@playwright/test";

// A custom zikir of 3, one of 2, a one-count one, a group of the last two, and one with no limit, saved before the app loads.
async function seedZikir(page: Page) {
  await page.addInitScript(() => {
    if (localStorage.getItem("e2e-zikir-seeded")) return;
    localStorage.setItem("e2e-zikir-seeded", "1");
    const base = { arabic: "", transliteration: "", meaning: "", dailyGoal: null, createdAt: 1, updatedAt: 1, deletedAt: null };
    localStorage.setItem(
      "qp-zikir",
      JSON.stringify({
        version: 1,
        state: {
          items: [
            { ...base, id: "three", name: "Three", target: 3 },
            { ...base, id: "two", name: "Two", target: 2 },
            { ...base, id: "one", name: "One", target: 1 },
            { ...base, id: "free", name: "Free", target: null },
          ],
          groups: [{ id: "pair", name: "Pair", steps: [{ itemId: "two", target: 2 }, { itemId: "one", target: 1 }], dailyGoal: null, createdAt: 1, updatedAt: 1, deletedAt: null }],
          counts: {},
          runs: {},
          history: [],
          settings: { view: "beads", sound: false, haptics: false, keepAwake: false },
        },
      }),
    );
  });
}

const countButton = (page: Page, name: string) => page.getByRole("button", { name: `Count ${name}`, exact: true });
// The ring text is also announced to screen readers, so look for it inside the button only.
const ringText = (page: Page, text: string) => page.getByRole("button", { name: /^Count / }).getByText(text, { exact: true });
const announcement = (page: Page) => page.locator("p.sr-only[aria-live='polite']");

test.beforeEach(async ({ page }) => {
  await seedZikir(page);
});

test("counts toward a target, takes back a count, and finishes the round", async ({ page }) => {
  await page.goto("/zikir/three");
  await expect(page.getByRole("heading", { name: "Three", level: 1 })).toBeVisible();
  await expect(ringText(page, "0 of 3")).toBeVisible();

  await countButton(page, "Three").click();
  await countButton(page, "Three").click();
  await expect(ringText(page, "2 of 3")).toBeVisible();
  await expect(page.getByText("Today: 2")).toBeVisible();

  await page.getByRole("button", { name: "Undo" }).click();
  await expect(ringText(page, "1 of 3")).toBeVisible();
  await expect(page.getByText("Today: 1")).toBeVisible();

  await countButton(page, "Three").click();
  await countButton(page, "Three").click();
  await expect(page.getByText("Round complete")).toBeVisible();
  await expect(page.getByText("Today: 3")).toBeVisible();
  await expect(page.getByRole("button", { name: "Undo" })).toBeDisabled();

  await countButton(page, "Three").click();
  await expect(page.getByText("Round complete")).toBeHidden();
  await expect(ringText(page, "1 of 3")).toBeVisible();
  await expect(page.getByText("Today: 4")).toBeVisible();
});

test("counts with the keyboard", async ({ page }) => {
  await page.goto("/zikir/three");
  await countButton(page, "Three").focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Space");
  await expect(ringText(page, "2 of 3")).toBeVisible();
});

test("announces the settled count to screen readers", async ({ page }) => {
  await page.goto("/zikir/three");
  await countButton(page, "Three").click();
  await countButton(page, "Three").click();
  await expect(announcement(page)).toHaveText("2 of 3");
});

test("moves through the steps of a group", async ({ page }) => {
  await page.goto("/zikir/pair");
  await expect(page.getByRole("heading", { name: "Pair", level: 1 })).toBeVisible();
  await expect(page.getByText("Step 1 of 2 · Two")).toBeVisible();
  await expect(page.getByText("Next: One")).toBeVisible();

  await countButton(page, "Two").click();
  await countButton(page, "Two").click();
  await expect(page.getByText("Step 2 of 2 · One")).toBeVisible();
  await expect(page.getByText("Next: One")).toBeHidden();

  await page.getByRole("button", { name: "Undo" }).click();
  await expect(page.getByText("Step 1 of 2 · Two")).toBeVisible();
  await expect(ringText(page, "1 of 2")).toBeVisible();

  await countButton(page, "Two").click();
  await countButton(page, "One").click();
  await expect(page.getByText("Round complete")).toBeVisible();
});

test("keeps a round going when you leave and come back", async ({ page }) => {
  await page.goto("/zikir/three");
  await countButton(page, "Three").click();
  await countButton(page, "Three").click();

  await page.goto("/zikir");
  const card = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: "Three", exact: true }) });
  await expect(card.getByText("In progress, 2 of 3")).toBeVisible();
  await card.getByRole("link", { name: "Count" }).click();
  await expect(ringText(page, "2 of 3")).toBeVisible();

  await page.reload();
  await expect(ringText(page, "2 of 3")).toBeVisible();
});

test("starts a round over only after confirming, keeping the day's total", async ({ page }) => {
  await page.goto("/zikir/three");
  await countButton(page, "Three").click();
  await countButton(page, "Three").click();
  await page.getByRole("button", { name: "Start over" }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog.getByText("Start this round over?")).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(ringText(page, "2 of 3")).toBeVisible();

  await page.getByRole("button", { name: "Start over" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Start over" }).click();
  await expect(ringText(page, "0 of 3")).toBeVisible();
  await expect(page.getByText("Today: 2")).toBeVisible();
});

test("counts without a limit and ends the round by hand", async ({ page }) => {
  await page.goto("/zikir/free");
  await expect(page.getByRole("button", { name: /^Count / }).getByText(/ of /)).toHaveCount(0);
  for (let i = 0; i < 5; i += 1) await countButton(page, "Free").click();
  await expect(page.getByText("Today: 5")).toBeVisible();
  await page.getByRole("button", { name: "Finish round" }).click();
  await expect(page.getByText("Round saved to your history")).toBeVisible();
  await expect(page.getByRole("button", { name: "Finish round" })).toBeDisabled();
});

test("shows a built-in zikir with its Arabic text and meaning", async ({ page }) => {
  await page.goto("/zikir");
  const card = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: "SubhanAllah", exact: true }) });
  await card.getByRole("link", { name: "Count" }).click();
  await expect(page).toHaveURL(/\/zikir\/builtin%3AsubhanAllah$/);
  await expect(page.getByText("سُبْحَانَ اللَّهِ")).toBeVisible();
  await expect(page.getByText("Glory be to Allah")).toBeVisible();
  await expect(ringText(page, "0 of 33")).toBeVisible();
  await countButton(page, "SubhanAllah").click();
  await expect(ringText(page, "1 of 33")).toBeVisible();
});

test("remembers the sound and vibration choices", async ({ page }) => {
  await page.goto("/zikir/three");
  const sound = page.getByRole("button", { name: "Sound" });
  await expect(sound).toHaveAttribute("aria-pressed", "false");
  await sound.click();
  await expect(sound).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(page.getByRole("button", { name: "Sound" })).toHaveAttribute("aria-pressed", "true");
});

test("says so when a zikir is not there anymore, and fits the screen", async ({ page }) => {
  await page.goto("/zikir/nothing-here");
  await expect(page.getByText("This zikir isn’t available anymore.")).toBeVisible();
  await page.getByRole("link", { name: "Back to zikir" }).click();
  await expect(page).toHaveURL(/\/zikir$/);

  await page.goto("/zikir/three");
  await expect(countButton(page, "Three")).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
