import { expect, test, type Page } from "@playwright/test";
import { mockAudio } from "./helpers";

const preview = (page: Page) => page.frameLocator('iframe[title="Live preview"]');
const previewSrc = async (page: Page) => new URL((await page.locator('iframe[title="Live preview"]').getAttribute("src"))!, page.url());
const code = (page: Page) => page.getByRole("tabpanel").locator("pre");
const group = (page: Page, name: string) => page.getByRole("group", { name, exact: true });
const choose = (page: Page, groupName: string, option: string) => group(page, groupName).getByText(option, { exact: true }).click();

test("opens for anyone, with no password", async ({ page }) => {
  await page.goto("/widgets");
  await expect(page.getByRole("heading", { name: "Tilawah widget", level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "Builder" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByLabel("Password")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Sign out" })).toHaveCount(0);
});

test("is indexable and listed in the sitemap, but not linked from the site", async ({ request }) => {
  const response = await request.get("/widgets");
  expect(response.status()).toBe(200);
  expect(response.headers()["x-robots-tag"] ?? "").not.toContain("noindex");
  expect(await (await request.get("/robots.txt")).text()).not.toContain("/widgets");
  expect((await request.get("/tracker")).status()).toBe(404);
});

test("turns a website address into the name visits are counted under", async ({ page }) => {
  await page.goto("/widgets");
  await expect(page.getByText("Until you type a name, the code uses my-site.")).toBeVisible();
  await page.getByLabel("Website address or name").fill("https://www.Example.com/some/page?x=1");
  await expect(page.getByText("Visits will be counted as example.com.")).toBeVisible();
  await expect(code(page)).toContainText('data-host="example.com"');
  await expect(code(page)).toContainText("/embed.js");
});

test("names a mobile app and shows the app code first", async ({ page }) => {
  await page.goto("/widgets");
  await group(page, "Placed in").getByText("A mobile app", { exact: true }).click();
  await expect(page.getByRole("tab", { name: "React Native" })).toHaveAttribute("aria-selected", "true");
  await page.getByLabel("App name").fill("My Great App");
  await expect(page.getByText("Visits will be counted as my-great-app.")).toBeVisible();
  await expect(code(page)).toContainText("host=my-great-app");
  await expect(code(page)).toContainText("allowsInlineMediaPlayback");
  await page.getByRole("tab", { name: "Flutter" }).click();
  await expect(code(page)).toContainText("host=my-great-app");
  await expect(code(page)).toContainText("addJavaScriptChannel");
});

test("asks for a usable name instead of putting a bad one in the code", async ({ page }) => {
  await page.goto("/widgets");
  await page.getByLabel("Website address or name").fill("!!!");
  await expect(page.getByRole("alert").filter({ hasText: "Use letters, numbers and dashes" })).toBeVisible();
  await expect(code(page)).toContainText('data-host="my-site"');
});

test("changes the live preview and the code together", async ({ page }) => {
  await page.goto("/widgets");
  await choose(page, "Theme", "Dark");
  await choose(page, "Style", "Tilawah");
  await choose(page, "Size", "Player only");
  await choose(page, "Corners", "Large");
  await expect(code(page)).toContainText('data-theme="dark" data-size="compact" data-style="tilawah" data-radius="lg"');

  await expect.poll(async () => (await previewSrc(page)).search).toContain("theme=dark");
  const src = await previewSrc(page);
  expect(Object.fromEntries(src.searchParams)).toEqual({ theme: "dark", style: "tilawah", size: "compact", radius: "lg", preview: "1" });

  await expect(preview(page).locator("html")).toHaveClass(/dark/);
  await expect(preview(page).locator("[data-embed-style]")).toHaveAttribute("data-embed-style", "tilawah");
  await expect(preview(page).getByRole("region", { name: "Audio player" })).toBeVisible();
  await expect(preview(page).getByRole("heading", { name: "Surahs" })).toHaveCount(0);
});

test("takes colours, and refuses text that is not a colour", async ({ page }) => {
  await page.goto("/widgets");
  await page.getByLabel("Accent", { exact: true }).fill("#c2410c");
  await expect(code(page)).toContainText('data-accent="#c2410c"');
  await expect.poll(() => preview(page).locator("[data-embed-style]").evaluate((el) => el.style.getPropertyValue("--primary"))).toBe("#c2410c");

  await page.getByLabel("Background", { exact: true }).fill("red");
  await expect(page.getByText("Use a hex colour such as #13756a.")).toBeVisible();
  await expect(code(page)).not.toContainText("data-bg");

  await page.getByRole("button", { name: "Clear the Accent colour" }).click();
  await expect(code(page)).not.toContainText("data-accent");
});

test("starts the preview on the chosen reciter and language", async ({ page }) => {
  await page.goto("/widgets");
  await page.getByLabel("Starting reciter").selectOption("30");
  await choose(page, "Widget language", "বাংলা");
  await expect(code(page)).toContainText('data-lang="bn" data-reciter="30"');
  await expect(preview(page).getByRole("heading", { name: "সূরাসমূহ" })).toBeVisible();
  await expect(preview(page).getByRole("button", { name: /সাদ/ })).toBeVisible();
});

test("keeps the settings in the address, restores them, and can reset", async ({ page }) => {
  await page.goto("/widgets");
  await choose(page, "Theme", "Dark");
  await page.getByLabel("Website address or name").fill("metrokoi.com");
  await expect(page).toHaveURL(/name=metrokoi\.com/);
  await expect(page).toHaveURL(/theme=dark/);

  await page.reload();
  await expect(page.getByLabel("Website address or name")).toHaveValue("metrokoi.com");
  await expect(group(page, "Theme").getByLabel("Dark")).toBeChecked();

  await page.getByRole("button", { name: "Reset to defaults" }).click();
  await expect(page.getByLabel("Website address or name")).toHaveValue("");
  await expect(group(page, "Theme").getByLabel("Auto")).toBeChecked();
  await expect(page).toHaveURL(/\/widgets$/);
});

test("opens a shared link with the same settings, and ignores bad ones", async ({ page }) => {
  await page.goto("/widgets?kind=app&name=Metro%20Koi&theme=dark&lang=bn&reciter=92&accent=%23c2410c");
  await expect(page.getByLabel("App name")).toHaveValue("Metro Koi");
  await expect(group(page, "Theme").getByLabel("Dark")).toBeChecked();
  await expect(page.getByLabel("Starting reciter")).toHaveValue("92");
  await expect(page.getByLabel("Accent", { exact: true })).toHaveValue("#c2410c");

  await page.goto("/widgets?kind=robot&theme=pink&reciter=7&accent=nope&name=" + "x".repeat(300));
  await expect(group(page, "Theme").getByLabel("Auto")).toBeChecked();
  await expect(page.getByLabel("Website address or name")).toHaveValue("x".repeat(100));
});

test("does not count the preview as a visit", async ({ page }) => {
  const sent: unknown[] = [];
  await page.route("**/api/widget/track", async (route) => {
    sent.push(route.request().postDataJSON());
    await route.fulfill({ status: 204 });
  });
  await mockAudio(page);
  await page.goto("/widgets?name=preview-check.example");
  await preview(page).getByRole("button", { name: /^Al-Fatihah/ }).click();
  await expect(preview(page).getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  await preview(page).getByRole("link", { name: /^View full details/ }).evaluate((a) => a.addEventListener("click", (event) => event.preventDefault()));
  await preview(page).getByRole("link", { name: /^View full details/ }).click();
  await page.waitForTimeout(500);
  expect(sent).toEqual([]);
});

test("shows the preview at phone, tablet and wide widths", async ({ page, isMobile }) => {
  test.skip(isMobile, "the viewport is already phone sized");
  await page.goto("/widgets");
  const frame = page.locator('iframe[title="Live preview"]');
  await expect(preview(page).getByRole("heading", { name: "Surahs" })).toBeVisible();
  const phone = (await frame.boundingBox())!.width;
  await choose(page, "Preview width", "Tablet");
  await expect.poll(async () => (await frame.boundingBox())!.width).toBeGreaterThan(phone);
  const tablet = (await frame.boundingBox())!.width;
  await choose(page, "Preview width", "Wide");
  await expect.poll(async () => (await frame.boundingBox())!.width).toBeGreaterThanOrEqual(tablet);
});

test("copies the code and the link to the settings exactly as shown", async ({ page, context, baseURL }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: baseURL! });
  await page.goto("/widgets");
  await choose(page, "Theme", "Dark");
  const shown = (await code(page).innerText()).trim();
  await page.getByRole("button", { name: /^Copy this code: Script tag/ }).click();
  expect((await page.evaluate(() => navigator.clipboard.readText())).trim()).toBe(shown);

  await page.getByRole("button", { name: "Copy a link to these settings" }).click();
  const link = new URL(await page.evaluate(() => navigator.clipboard.readText()));
  expect(link.pathname).toBe("/widgets");
  expect(link.searchParams.get("theme")).toBe("dark");

  await page.getByRole("button", { name: "Copy the widget address" }).click();
  const address = new URL(await page.evaluate(() => navigator.clipboard.readText()));
  expect(address.pathname).toBe("/embed");
  expect(address.searchParams.get("host")).toBe("my-site");
  expect(address.searchParams.has("preview")).toBe(false);
});

test("lists what was counted, filters by host and downloads it as CSV", async ({ page, request, baseURL }) => {
  const id = Math.random().toString(36).slice(2, 10);
  const mine = `e2e-${id}.example`;
  const other = `other-${id}.example`;
  for (const [host, events] of [[mine, ["view", "view", "view", "play", "click"]], [other, ["view"]]] as const) {
    for (const event of events) {
      expect((await request.post("/api/widget/track", { data: { event, host }, headers: { origin: baseURL! } })).status()).toBe(204);
    }
  }

  await page.goto("/widgets?tab=numbers");
  await expect(page.getByRole("link", { name: "Numbers" })).toHaveAttribute("aria-current", "page");
  await expect(page.getByRole("row", { name: new RegExp(mine) }).getByRole("cell")).toHaveText(["3", "1", "1", "1", "33.3%"]);
  await expect(page.getByRole("row", { name: new RegExp(other) })).toBeVisible();

  await page.getByLabel("Host", { exact: true }).fill(mine);
  await page.getByRole("button", { name: "Filter" }).click();
  await expect(page).toHaveURL(new RegExp(`host=${mine}`));
  await expect(page.getByRole("row", { name: new RegExp(mine) })).toBeVisible();
  await expect(page.getByRole("row", { name: new RegExp(other) })).toHaveCount(0);
  await page.getByRole("link", { name: "7 days" }).click();
  await expect(page).toHaveURL(new RegExp(`days=7.*host=${mine}`));

  await page.goto(`/widgets?tab=numbers&host=nobody-${id}.example`);
  await expect(page.getByText(`Nothing counted for nobody-${id}.example in this period yet.`)).toBeVisible();
  await page.getByRole("link", { name: "Show all hosts" }).click();
  await expect(page.getByRole("row", { name: new RegExp(mine) })).toBeVisible();

  const all = await request.get("/widgets/export?days=30");
  expect(all.status()).toBe(200);
  expect(all.headers()["content-type"]).toContain("text/csv");
  expect(all.headers()["content-disposition"]).toContain("attachment");
  const body = await all.text();
  expect(body.split("\n")[0]).toBe("day,host,event,hits,uniques");
  expect(body).toMatch(new RegExp(`\\d{4}-\\d{2}-\\d{2},${mine},view,3,1`));
  expect(body).toContain(other);

  const only = await (await request.get(`/widgets/export?days=30&host=${mine}`)).text();
  expect(only).toContain(mine);
  expect(only).not.toContain(other);
  expect((await request.get("/widgets/export?days=5; drop&host=%27%3B--")).status()).toBe(200);
});

test("switches between English and Bengali", async ({ page }) => {
  await page.goto("/widgets");
  await group(page, "Language").getByText("বাংলা", { exact: true }).click();
  await expect(page.getByRole("heading", { name: "তিলাওয়াত উইজেট", level: 1 })).toBeVisible();
  await expect(page.getByRole("link", { name: "বিল্ডার" })).toBeVisible();
  await page.getByRole("link", { name: "হিসাব" }).click();
  await expect(page.getByRole("link", { name: "CSV নামান" })).toBeVisible();
  await group(page, "ভাষা").getByText("English", { exact: true }).click();
  await expect(page.getByRole("heading", { name: "Tilawah widget", level: 1 })).toBeVisible();
});

test("keeps the reference guide", async ({ page }) => {
  await page.goto("/widgets");
  await page.getByRole("link", { name: "Integration guide" }).click();
  await expect(page).toHaveURL(/tab=guide/);
  for (const heading of ["Website", "Mobile app (WebView)", "Options", "What is counted"]) {
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  }
  const names = await page.getByRole("table").getByRole("rowheader").allInnerTexts();
  expect(names).toEqual(["theme", "lang", "size", "style", "reciter", "accent", "bg", "card", "text", "radius", "host"]);
});

test("never gives the tab bar a scroll bar, even on a very narrow screen", async ({ page }) => {
  for (const width of [280, 360, 1280]) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/widgets");
    const tabs = page.getByRole("navigation", { name: "Sections" });
    await expect(tabs.getByRole("link")).toHaveCount(3);
    const { overflowX, overflows } = await tabs.evaluate((el) => ({ overflowX: getComputedStyle(el).overflowX, overflows: el.scrollWidth > el.clientWidth }));
    expect(overflowX, `${width}px`).toBe("visible");
    expect(overflows, `${width}px`).toBe(false);
    for (const link of await tabs.getByRole("link").all()) await expect(link).toBeVisible();
  }
});

test("fits a phone screen on every tab", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  for (const path of ["/widgets", "/widgets?tab=numbers", "/widgets?tab=guide"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: "Tilawah widget", level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), path).toBe(true);
  }
});
