import { expect, test } from "@playwright/test";
import { goToPage } from "./helpers";

test("shows today's progress on Home, even for a new listener", async ({ page }) => {
  await page.goto("/");
  const today = page.getByRole("region", { name: new Intl.DateTimeFormat("en", { weekday: "long", day: "numeric", month: "long" }).format(new Date()) });
  await expect(today.getByText("0 of 114 surahs")).toBeVisible();
  await expect(today.getByText(/ AH$/)).toBeVisible();
  await expect(today.getByRole("link", { name: "Plan a khatm" })).toBeVisible();
});

test("sets a khatm plan, shows it on Home, and removes it", async ({ page, isMobile }) => {
  await page.goto("/progress");
  const plan = page.getByRole("region", { name: "Khatm plan" });
  await plan.getByRole("button", { name: "In 30 days" }).click();
  await expect(plan.getByText("30 days left")).toBeVisible();
  await expect(plan.getByText(/About .* paras a day/)).toBeVisible();

  await goToPage(page, isMobile, "Home");
  await expect(page.getByRole("link", { name: /Khatm plan: about .* paras a day, 30 days left/ })).toBeVisible();

  await page.reload();
  await expect(page.getByRole("link", { name: /30 days left/ })).toBeVisible();
  await page.getByRole("link", { name: /30 days left/ }).click();
  await page.getByRole("region", { name: "Khatm plan" }).getByRole("button", { name: "Remove plan" }).click();
  await expect(page.getByRole("region", { name: "Khatm plan" }).getByRole("button", { name: "In 30 days" })).toBeVisible();
});

test("picks a date by hand and refuses one in the past", async ({ page }) => {
  await page.goto("/progress");
  const plan = page.getByRole("region", { name: "Khatm plan" });
  const field = plan.getByLabel("Or pick a date");
  await field.fill("2020-01-01");
  await expect(plan.getByRole("button", { name: "Set plan" })).toBeDisabled();
  const later = new Date();
  later.setDate(later.getDate() + 9);
  await field.fill(`${later.getFullYear()}-${String(later.getMonth() + 1).padStart(2, "0")}-${String(later.getDate()).padStart(2, "0")}`);
  await plan.getByRole("button", { name: "Set plan" }).click();
  await expect(plan.getByText("10 days left")).toBeVisible();
});

test("reminds to sync after a week and stays quiet once waved away", async ({ page }) => {
  await page.addInitScript(() => {
    if (localStorage.getItem("e2e-seeded")) return;
    localStorage.setItem("e2e-seeded", "1");
    localStorage.setItem("qp-sync", JSON.stringify({ version: 0, state: { key: null, lastSyncedAt: Date.now() - 9 * 86_400_000, nudgeDismissedAt: null } }));
  });
  await page.goto("/");
  await expect(page.getByText("Last synced 9 days ago.")).toBeVisible();
  await page.getByRole("button", { name: "Not now" }).click();
  await expect(page.getByText("Last synced 9 days ago.")).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("link", { name: "Plan a khatm" })).toBeVisible();
  await expect(page.getByText("Last synced 9 days ago.")).toHaveCount(0);
});
