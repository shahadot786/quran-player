import { expect, test, type Page } from "@playwright/test";

const dayKey = (offset: number) => {
  const date = new Date();
  date.setDate(date.getDate() - offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

async function seed(page: Page) {
  const today = dayKey(0);
  await page.addInitScript(
    ({ today, yesterday }) => {
      if (localStorage.getItem("e2e-seeded")) return;
      localStorage.setItem("e2e-seeded", "1");
      localStorage.setItem("qp-stats", JSON.stringify({ version: 0, state: { totalSeconds: 3000, daily: { [today]: 1800, [yesterday]: 1200 }, reciters: {}, completed: {} } }));
      const session = { id: "s1", day: today, startedAt: Date.now() - 1_800_000, updatedAt: Date.now(), surah: 18, reciterId: 123, reciterName: "Mishary Alafasi", moshafId: 123, seconds: 1800 };
      localStorage.setItem("qp-sessions", JSON.stringify({ version: 0, state: { sessions: [session] } }));
      const counts = { [today]: { "builtin:subhanAllah": { phone: { n: 33, at: 1 } } } };
      localStorage.setItem(
        "qp-zikir",
        JSON.stringify({ version: 1, state: { items: [], groups: [], counts, runs: {}, history: [], builtIns: {}, settings: { view: "simple", sound: false, haptics: false, keepAwake: false } } }),
      );
    },
    { today, yesterday: dayKey(1) },
  );
}

test("shows the listening year with its active days and what was heard on a day", async ({ page }) => {
  await seed(page);
  await page.goto("/stats");
  const calendar = page.getByRole("region", { name: "Listening calendar" });
  const year = String(new Date().getFullYear());
  // Yesterday may fall in last year on 1 January, so only the all-time count is fixed.
  await expect(calendar.getByText("2 days in all")).toBeVisible();
  await expect(calendar.getByText(year, { exact: true })).toBeVisible();

  const today = calendar.locator('button[tabindex="0"]');
  await expect(today).toHaveAttribute("aria-label", /30 min/);
  await today.focus();
  await page.keyboard.press("Enter");
  const sheet = page.getByRole("dialog");
  await expect(sheet.getByText("Al-Kahf")).toBeVisible();
  await expect(sheet.getByText(/Mishary Alafasi/)).toBeVisible();
  await expect(sheet.getByText(/ AH$/)).toBeVisible();
  await page.keyboard.press("Escape");

  await today.focus();
  await page.keyboard.press("ArrowUp");
  await expect(calendar.locator('button[tabindex="0"]')).toBeFocused();
  await expect(calendar.locator('button[tabindex="0"]')).not.toHaveAttribute("aria-label", /30 min/);
});

test("says when only the total is known for a day", async ({ page }) => {
  await seed(page);
  await page.goto("/stats");
  const calendar = page.getByRole("region", { name: "Listening calendar" });
  const yesterday = dayKey(1);
  test.skip(!yesterday.startsWith(String(new Date().getFullYear())), "yesterday is in last year's grid");
  await calendar.locator('button[tabindex="0"]').focus();
  await page.keyboard.press("ArrowUp");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog").getByText(/Only the total time is known/)).toBeVisible();
});

test("shows the zikir year and what was counted on a day", async ({ page }) => {
  await seed(page);
  await page.goto("/zikir");
  await page.getByRole("tab", { name: "Stats" }).click();
  const calendar = page.getByRole("region", { name: "Zikir calendar" });
  await expect(calendar.getByText("1 day in all")).toBeVisible();
  await calendar.locator('button[tabindex="0"]').click();
  const sheet = page.getByRole("dialog");
  await expect(sheet.getByText("SubhanAllah")).toBeVisible();
  await expect(sheet.getByText("33 counts").first()).toBeVisible();
});

test("reads in Bengali with Bengali digits and a Hijri date", async ({ page, context }) => {
  await context.addCookies([{ name: "NEXT_LOCALE", value: "bn", url: "http://localhost:3100" }]);
  await seed(page);
  await page.goto("/stats");
  const calendar = page.getByRole("region", { name: "শোনার ক্যালেন্ডার" });
  await expect(calendar.getByText("সব মিলিয়ে ২ দিন")).toBeVisible();
  await calendar.locator('button[tabindex="0"]').click();
  await expect(page.getByRole("dialog").getByText(/হিজরি$/)).toBeVisible();
  await expect(page.locator("body")).not.toContainText("NaN");
});
