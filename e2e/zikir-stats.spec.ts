import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

const dayKey = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() - offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const cell = (n: number) => ({ phone: { n, at: 1 } });

type Seed = { counts?: Record<string, Record<string, Record<string, { n: number; at: number }>>>; history?: unknown[]; groupGoal?: number | null };

// A custom zikir with a goal of 10 and a group with a goal of 2 rounds, plus whatever counts and history a test needs.
async function seed(page: Page, data: Seed = {}) {
  await page.addInitScript((input) => {
    if (localStorage.getItem("e2e-zikir-seeded")) return;
    localStorage.setItem("e2e-zikir-seeded", "1");
    const base = { arabic: "", transliteration: "", meaning: "", createdAt: 1, updatedAt: 1, deletedAt: null };
    localStorage.setItem(
      "qp-zikir",
      JSON.stringify({
        version: 1,
        state: {
          items: [{ ...base, id: "goal", name: "Goal item", target: 50, dailyGoal: 10 }],
          groups: [{ ...base, id: "pair", name: "Pair", steps: [{ itemId: "goal", target: 1 }], dailyGoal: input.groupGoal ?? 2 }],
          counts: input.counts ?? {},
          runs: {},
          history: input.history ?? [],
          builtIns: {},
          settings: { view: "simple", sound: false, haptics: false, keepAwake: false },
        },
      }),
    );
  }, data);
}

const card = (page: Page, name: string) => page.getByRole("listitem").filter({ has: page.getByRole("heading", { name, exact: true }) });
const round = (id: string, kind: "item" | "group", refId: string, name: string | null, completed: boolean, minutesAgo: number) => ({
  id, kind, refId, name, count: 12, completed, finishedAt: Date.now() - minutesAgo * 60_000,
});

test("shows today's goal on the card and on the counter page, and marks it reached", async ({ page }) => {
  await seed(page, { counts: { [dayKey(0)]: { goal: cell(4) } }, history: [round("a", "group", "pair", "Pair", true, 5)] });
  await page.goto("/zikir");
  await expect(card(page, "Goal item").getByText("Goal today: 4 of 10")).toBeVisible();
  await expect(card(page, "Pair").getByText("Goal today: 1 of 2 rounds")).toBeVisible();
  await expect(card(page, "SubhanAllah").getByText(/Goal today/)).toHaveCount(0);

  await card(page, "Goal item").getByRole("link", { name: "Count" }).click();
  await expect(page.getByText("Goal today: 4 of 10")).toBeVisible();
  const count = page.getByRole("button", { name: "Count Goal item", exact: true });
  for (let i = 0; i < 6; i += 1) await count.click();
  await expect(page.getByText("Goal reached")).toBeVisible();
});

test("shows totals, streaks and the week on the stats tab", async ({ page }) => {
  await seed(page, {
    counts: { [dayKey(0)]: { goal: cell(12), "builtin:subhanAllah": cell(33) }, [dayKey(1)]: { goal: cell(10) }, [dayKey(2)]: { goal: cell(15) }, [dayKey(4)]: { goal: cell(3) } },
  });
  await page.goto("/zikir");
  await page.getByRole("tab", { name: "Stats" }).click();

  await expect(page.getByText("All-time count").locator("..").getByText("73", { exact: true })).toBeVisible();
  await expect(page.getByText("Counted today").locator("..").getByText("45", { exact: true })).toBeVisible();
  await expect(page.getByText("Current streak").locator("..").getByText("3 days")).toBeVisible();
  await expect(page.getByText("Longest streak").locator("..").getByText("3 days")).toBeVisible();

  await expect(page.getByRole("img", { name: /, 45 counts$/ })).toBeVisible();
  await expect(page.getByRole("img", { name: /, 3 counts$/ })).toBeVisible();

  const top = page.getByRole("region", { name: "Most counted" }).getByRole("listitem");
  await expect(top.first()).toContainText("Goal item");
  await expect(top.first()).toContainText("40");
  await expect(top.nth(1)).toContainText("SubhanAllah");
});

test("does not count a day that misses its goal toward the streak", async ({ page }) => {
  await seed(page, { counts: { [dayKey(0)]: { goal: cell(10) }, [dayKey(1)]: { goal: cell(9) }, [dayKey(2)]: { goal: cell(30) } } });
  await page.goto("/zikir");
  await page.getByRole("tab", { name: "Stats" }).click();
  await expect(page.getByText("Current streak").locator("..").getByText("1 day")).toBeVisible();
  await expect(page.getByText("Longest streak").locator("..").getByText("1 day")).toBeVisible();
});

test("asks you to start counting when there is nothing yet", async ({ page }) => {
  await page.goto("/zikir");
  await page.getByRole("tab", { name: "Stats" }).click();
  await expect(page.getByText("Start counting and your numbers will show up here.")).toBeVisible();
  await page.getByRole("tab", { name: "History" }).click();
  await expect(page.getByText("Rounds you finish will be listed here.")).toBeVisible();
});

test("lists finished rounds and clears them after confirming", async ({ page }) => {
  await seed(page, {
    history: [
      round("1", "item", "goal", "Goal item", true, 5),
      round("2", "item", "builtin:subhanAllah", null, false, 90),
      round("3", "group", "builtin:afterSalah", null, true, 3000),
      round("4", "item", "gone", "Old custom", true, 5000),
    ],
  });
  await page.goto("/zikir");
  await page.getByRole("tab", { name: "History" }).click();

  const list = page.getByRole("region", { name: "Finished rounds" });
  const rows = list.getByRole("listitem");
  await expect(rows).toHaveCount(4);
  await expect(rows.nth(0)).toContainText("Goal item");
  await expect(rows.nth(0)).toContainText("Completed");
  await expect(rows.nth(1)).toContainText("SubhanAllah");
  await expect(rows.nth(1)).toContainText("Ended early");
  await expect(rows.nth(2)).toContainText("After salah");
  await expect(rows.nth(3)).toContainText("Old custom");

  await list.getByRole("button", { name: "Clear history" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Clear history" }).click();
  await expect(page.getByText("Rounds you finish will be listed here.")).toBeVisible();
});

test("includes zikir in a backup and removes it on reset", async ({ page }) => {
  await seed(page, { counts: { [dayKey(0)]: { goal: cell(7) } }, history: [round("1", "item", "goal", "Goal item", true, 5)] });
  await page.goto("/stats");
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export backup" }).click();
  const backup = JSON.parse(await readFile((await (await download).path())!, "utf8"));
  expect(backup.data.zikir.items.map((item: { name: string }) => item.name)).toEqual(["Goal item"]);
  expect(backup.data.zikir.history).toHaveLength(1);
  expect(backup.data.zikir.counts[dayKey(0)].goal.phone.n).toBe(7);
  expect(backup.data.zikir.runs).toBeUndefined();
  expect(backup.data.zikir.settings).toBeUndefined();

  await page.getByRole("button", { name: "Reset all data" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Reset" }).click();
  await page.goto("/zikir");
  await expect(card(page, "Goal item")).toHaveCount(0);
  await expect(card(page, "SubhanAllah")).toBeVisible();
  await page.getByRole("tab", { name: "History" }).click();
  await expect(page.getByText("Rounds you finish will be listed here.")).toBeVisible();
});

test("fits the screen on every tab", async ({ page }) => {
  await seed(page, { counts: { [dayKey(0)]: { goal: cell(12) } }, history: [round("1", "item", "goal", "Goal item", true, 5)] });
  for (const tab of ["Library", "Stats", "History"]) {
    await page.goto("/zikir");
    await page.getByRole("tab", { name: tab }).click();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, `${tab} overflows`).toBeLessThanOrEqual(0);
  }
});
