import { expect, test, type Page } from "@playwright/test";

const pad = (value: number) => String(value).padStart(2, "0");
const earlierToday = () => {
  const now = new Date();
  return now.getHours() === 0 && now.getMinutes() < 2 ? null : `${pad(now.getHours())}:${pad(Math.max(0, now.getMinutes() - 1))}`;
};

// Records notifications instead of showing them, so the test can see what would have appeared.
async function recordNotifications(page: Page) {
  await page.addInitScript(() => {
    const shown: string[] = [];
    (window as unknown as { shown: string[] }).shown = shown;
    class FakeNotification {
      static permission = "granted";
      static requestPermission = async () => "granted";
      constructor(title: string) {
        shown.push(title);
      }
    }
    Object.defineProperty(window, "Notification", { value: FakeNotification, configurable: true });
  });
}

test("a reminder whose time has passed waits on Home, notifies once, and can be waved away", async ({ page }) => {
  const time = earlierToday();
  test.skip(time === null, "too close to midnight");
  await recordNotifications(page);
  await page.goto("/stats");
  const settings = page.getByRole("region", { name: "Reminders" });
  await settings.getByRole("switch", { name: "Evening zikir" }).click();
  await settings.getByLabel("Time for Evening zikir").fill(time!);

  await expect.poll(() => page.evaluate(() => (window as unknown as { shown: string[] }).shown)).toEqual(["Evening zikir"]);

  await page.goto("/");
  const due = page.getByRole("list", { name: "Reminders for today" });
  await expect(due.getByText("Time for your evening zikir.")).toBeVisible();
  await expect(due.getByRole("link", { name: "Open zikir" })).toHaveAttribute("href", "/zikir");
  await page.waitForTimeout(500);
  expect(await page.evaluate(() => (window as unknown as { shown: string[] }).shown)).toEqual([]);

  await due.getByRole("button", { name: "Dismiss Evening zikir" }).click();
  await expect(page.getByText("Time for your evening zikir.")).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole("link", { name: "Plan a khatm" })).toBeVisible();
  await expect(page.getByText("Time for your evening zikir.")).toHaveCount(0);
});

test("the zikir reminder clears itself once zikir is counted", async ({ page }) => {
  const time = earlierToday();
  test.skip(time === null, "too close to midnight");
  await page.goto("/stats");
  const settings = page.getByRole("region", { name: "Reminders" });
  await settings.getByRole("switch", { name: "Morning zikir" }).click();
  await settings.getByLabel("Time for Morning zikir").fill(time!);
  await page.goto("/");
  await expect(page.getByText("Time for your morning zikir.")).toBeVisible();

  await page.goto("/zikir/builtin:subhanAllah");
  await page.getByRole("button", { name: "Simple" }).click();
  await page.getByRole("button", { name: /^Count/ }).click();
  await page.goto("/");
  await expect(page.getByRole("link", { name: "Plan a khatm" })).toBeVisible();
  await expect(page.getByText("Time for your morning zikir.")).toHaveCount(0);
});

test("the listening reminder only shows while today's goal isn't met", async ({ page }) => {
  const time = earlierToday();
  test.skip(time === null, "too close to midnight");
  await page.goto("/stats");
  const settings = page.getByRole("region", { name: "Reminders" });
  await settings.getByRole("switch", { name: "Daily listening" }).click();
  await settings.getByLabel("Time for Daily listening").fill(time!);
  await page.goto("/");
  await expect(page.getByText("You haven’t reached today’s listening goal yet.")).toBeVisible();

  await page.evaluate(() => {
    const key = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    localStorage.setItem("qp-stats", JSON.stringify({ version: 0, state: { totalSeconds: 1200, daily: { [key(new Date())]: 1200 }, reciters: {}, completed: {} } }));
  });
  await page.reload();
  await expect(page.getByRole("link", { name: "Plan a khatm" })).toBeVisible();
  await expect(page.getByText("You haven’t reached today’s listening goal yet.")).toHaveCount(0);
});
