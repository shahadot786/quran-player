import { expect, test, type Page } from "@playwright/test";

async function seed(page: Page, view = "beads") {
  await page.addInitScript((chosen) => {
    if (localStorage.getItem("e2e-zikir-seeded")) return;
    localStorage.setItem("e2e-zikir-seeded", "1");
    const item = { id: "three", name: "Three", arabic: "", transliteration: "", meaning: "", target: 3, dailyGoal: null, createdAt: 1, updatedAt: 1, deletedAt: null };
    localStorage.setItem(
      "qp-zikir",
      JSON.stringify({ version: 1, state: { items: [item], groups: [], counts: {}, runs: {}, history: [], builtIns: {}, settings: { view: chosen, sound: false, haptics: false, keepAwake: false } } }),
    );
  }, view);
}

const stage = (page: Page) => page.getByRole("button", { name: "Count Three", exact: true });
const canvas = (page: Page) => stage(page).locator("canvas");
const ringText = (page: Page, text: string) => stage(page).getByText(text, { exact: true });

test("draws a bead string and counts by tapping it", async ({ page }) => {
  const errors: string[] = [];
  // With service workers blocked, as in these tests, the PWA client logs "reading 'waiting'" on every page; it is not a 3D error.
  page.on("pageerror", (error) => !error.message.includes("'waiting'") && errors.push(error.message));
  await seed(page);
  await page.goto("/zikir/three");
  await expect(canvas(page)).toHaveCount(1);
  await expect(ringText(page, "0 of 3")).toBeVisible();

  const before = await stage(page).screenshot();
  expect(before.length).toBeGreaterThan(8000);
  await stage(page).click();
  await expect(ringText(page, "1 of 3")).toBeVisible();
  await expect.poll(async () => (await stage(page).screenshot()).equals(before)).toBe(false);
  expect(errors).toEqual([]);
});

test("switches between the bead string, the dial and the simple counter without losing the count", async ({ page }) => {
  await seed(page);
  await page.goto("/zikir/three");
  await stage(page).click();

  await page.getByRole("button", { name: "Dial" }).click();
  await expect(page.getByRole("button", { name: "Dial" })).toHaveAttribute("aria-pressed", "true");
  await expect(canvas(page)).toHaveCount(1);
  await expect(ringText(page, "1 of 3")).toBeVisible();
  await stage(page).click();
  await expect(ringText(page, "2 of 3")).toBeVisible();

  await page.getByRole("button", { name: "Simple" }).click();
  await expect(canvas(page)).toHaveCount(0);
  await expect(ringText(page, "2 of 3")).toBeVisible();

  await page.getByRole("button", { name: "Bead string" }).click();
  await expect(canvas(page)).toHaveCount(1);
  await expect(ringText(page, "2 of 3")).toBeVisible();
});

test("counts with the keyboard on the 3D views too", async ({ page }) => {
  await seed(page, "dial");
  await page.goto("/zikir/three");
  await stage(page).focus();
  await page.keyboard.press("Enter");
  await page.keyboard.press("Space");
  await expect(ringText(page, "2 of 3")).toBeVisible();
});

test("remembers the chosen view", async ({ page }) => {
  await seed(page);
  await page.goto("/zikir/three");
  await page.getByRole("button", { name: "Dial" }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Dial" })).toHaveAttribute("aria-pressed", "true");
  await expect(canvas(page)).toHaveCount(1);
});

test("finishes a round on the 3D view", async ({ page }) => {
  await seed(page);
  await page.goto("/zikir/three");
  for (let i = 0; i < 3; i += 1) await stage(page).click();
  await expect(page.getByText("Round complete")).toBeVisible();
  await stage(page).click();
  await expect(ringText(page, "1 of 3")).toBeVisible();
});

test("uses the plain counter when the browser has no WebGL", async ({ page }) => {
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (this: HTMLCanvasElement, type: string, ...rest: unknown[]) {
      return type.startsWith("webgl") ? null : (original as (...args: unknown[]) => RenderingContext | null).call(this, type, ...rest);
    } as typeof original;
  });
  await seed(page);
  await page.goto("/zikir/three");
  await expect(stage(page)).toBeVisible();
  await expect(canvas(page)).toHaveCount(0);
  await stage(page).click();
  await expect(ringText(page, "1 of 3")).toBeVisible();
});

test("uses the plain counter when reduced motion is preferred", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await seed(page);
  await page.goto("/zikir/three");
  await expect(stage(page)).toBeVisible();
  await expect(canvas(page)).toHaveCount(0);
  await stage(page).click();
  await expect(ringText(page, "1 of 3")).toBeVisible();
});

test("falls back to the plain counter if the graphics context is lost", async ({ page }) => {
  await seed(page);
  await page.goto("/zikir/three");
  await expect(canvas(page)).toHaveCount(1);
  await stage(page).click();
  await page.evaluate(() => {
    const element = document.querySelector("button canvas") as HTMLCanvasElement;
    const gl = (element.getContext("webgl2") ?? element.getContext("webgl")) as WebGL2RenderingContext;
    gl.getExtension("WEBGL_lose_context")!.loseContext();
  });
  await expect(canvas(page)).toHaveCount(0);
  await expect(ringText(page, "1 of 3")).toBeVisible();
  await stage(page).click();
  await expect(ringText(page, "2 of 3")).toBeVisible();
});

test("offers to keep the screen on and remembers it", async ({ page }) => {
  await seed(page);
  await page.goto("/zikir/three");
  const toggle = page.getByRole("button", { name: "Keep screen on" });
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(page.getByRole("button", { name: "Keep screen on" })).toHaveAttribute("aria-pressed", "true");
});

test("fits the screen with the 3D view", async ({ page }) => {
  await seed(page);
  await page.goto("/zikir/three");
  await expect(canvas(page)).toHaveCount(1);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});
