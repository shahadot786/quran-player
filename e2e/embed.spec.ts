import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { expect, test, type Page } from "@playwright/test";
import { mockAudio } from "./helpers";

type Sent = { event: string; host: string | null };
const sent: Sent[] = [];

// The counting request is answered here, so a test run never writes into a real database.
test.beforeEach(async ({ page }) => {
  sent.length = 0;
  await page.route("**/api/widget/track", async (route) => {
    sent.push(JSON.parse(route.request().postData() ?? "{}"));
    await route.fulfill({ status: 204 });
  });
});

const surahButton = (page: Page, name: string) => page.getByRole("button", { name: new RegExp(`^${name}`) });

test("shows only the widget, with none of the site around it", async ({ page }) => {
  await page.goto("/embed");
  await expect(page.getByRole("heading", { name: "Surahs" })).toBeVisible();
  await expect(page.getByRole("link", { name: /^View full details/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Zikir" })).toHaveCount(0);
  await expect(page.getByRole("navigation")).toHaveCount(0);
  await expect(page.getByText("Powered by Tilawah")).toBeVisible();
});

test("plays a surah, moves to the next and keeps the position after a reload", async ({ page }) => {
  await mockAudio(page);
  await page.goto("/embed");
  await surahButton(page, "Al-Fatihah").click();
  const player = page.getByRole("region", { name: "Audio player" });
  await expect(player.getByRole("heading", { name: "Al-Fatihah" })).toBeVisible();
  await expect(player.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  await expect(player.getByText("2:00")).toBeVisible();

  await player.getByRole("button", { name: "Next surah" }).click();
  await expect(player.getByRole("heading", { name: "Al-Baqarah" })).toBeVisible();
  await player.getByRole("button", { name: "Pause", exact: true }).click();

  await page.reload();
  await expect(page.getByRole("region", { name: "Audio player" }).getByRole("heading", { name: "Al-Baqarah" })).toBeVisible();
});

test("changes the reciter and keeps the surah", async ({ page }) => {
  await mockAudio(page);
  await page.goto("/embed");
  await expect(page.getByRole("button", { name: "Change reciter" })).toContainText("Mishary Alafasi");
  await surahButton(page, "Ya-Sin").click();
  await page.getByRole("button", { name: "Change reciter" }).click();
  await page.getByRole("menuitemradio", { name: "Saad Al-Ghamdi" }).click();
  await expect(page.getByRole("button", { name: "Change reciter" })).toContainText("Saad Al-Ghamdi");
  await expect(page.getByRole("region", { name: "Audio player" }).getByRole("heading", { name: "Ya-Sin" })).toBeVisible();
});

test("starts on the reciter the host asked for, and ignores one that is not offered", async ({ page }) => {
  await page.goto("/embed?reciter=30");
  await expect(page.getByRole("button", { name: "Change reciter" })).toContainText("Saad Al-Ghamdi");
  await page.goto("/embed?reciter=999999");
  await expect(page.getByRole("button", { name: "Change reciter" })).toContainText("Mishary Alafasi");
});

test("applies the theme, language, colours and radius from the address", async ({ page }) => {
  await page.goto("/embed?theme=dark&lang=bn&accent=%23c2410c&radius=lg");
  await expect(page.locator("html")).toHaveClass(/dark/);
  await expect(page.getByRole("heading", { name: "সূরাসমূহ" })).toBeVisible();
  const widget = page.locator("[data-embed-style]");
  await expect(widget).toHaveAttribute("data-embed-style", "koi");
  expect(await widget.evaluate((el) => el.style.getPropertyValue("--primary"))).toBe("#c2410c");
  expect(await widget.evaluate((el) => el.style.getPropertyValue("--radius"))).toBe("1rem");

  await page.goto("/embed?theme=light&style=tilawah");
  await expect(page.locator("html")).not.toHaveClass(/dark/);
  await expect(page.locator("[data-embed-style]")).toHaveAttribute("data-embed-style", "tilawah");
});

test("falls back to the defaults for bad values and never takes a colour that is not a colour", async ({ page }) => {
  await page.goto("/embed?theme=pink&lang=fr&style=x&accent=red;}body{display:none&bg=url(x)");
  await expect(page.getByRole("heading", { name: "Surahs" })).toBeVisible();
  const widget = page.locator("[data-embed-style]");
  await expect(widget).toHaveAttribute("data-embed-style", "koi");
  expect(await widget.evaluate((el) => el.style.getPropertyValue("--primary"))).toBe("");
  expect(await widget.evaluate((el) => el.style.getPropertyValue("--background"))).toBe("");
});

test("shows the player alone at the compact size", async ({ page }) => {
  await page.goto("/embed?size=compact");
  await expect(page.getByRole("region", { name: "Audio player" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Surahs" })).toHaveCount(0);
  await expect(page.getByRole("list")).toHaveCount(0);
});

test("opens the main site in a new tab, on the surah that is playing", async ({ page }) => {
  await mockAudio(page);
  await page.goto("/embed?host=metrokoi-app");
  const link = page.getByRole("link", { name: /^View full details/ });
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", /noopener/);
  expect(new URL((await link.getAttribute("href"))!).pathname).toBe("/");

  await surahButton(page, "Ya-Sin").click();
  const url = new URL((await link.getAttribute("href"))!);
  expect(url.pathname).toBe("/surahs/36");
  expect(url.searchParams.get("utm_source")).toBe("widget");
  expect(url.searchParams.get("utm_medium")).toBe("metrokoi-app");
});

test("shows the visitor's own listening numbers", async ({ page }) => {
  const today = new Date();
  const key = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  await page.addInitScript((day) => {
    localStorage.setItem(
      "qp-stats",
      JSON.stringify({ version: 0, state: { totalSeconds: 190, daily: { [day]: 190 }, reciters: {}, completed: { "5:1": { surah: 1, reciterId: 123, count: 1, lastAt: 1 } } } }),
    );
  }, key);
  await page.goto("/embed");
  const stats = page.getByRole("region", { name: "Your listening" });
  await expect(stats.getByText("3 min")).toBeVisible();
  await expect(stats.getByText("1 day", { exact: true })).toBeVisible();
  await expect(stats.getByText("1 surah", { exact: true })).toBeVisible();
  await expect(page.getByText("Listen for a minute")).toHaveCount(0);
});

test("says there is nothing yet when the visitor has not listened", async ({ page }) => {
  await page.goto("/embed");
  await expect(page.getByText("Listen for a minute and your numbers show up here.")).toBeVisible();
});

test("works inside a frame on another site, and tells that site how tall it is", async ({ page, baseURL }) => {
  await mockAudio(page);
  const host = createServer((_, response) => {
    response.setHeader("Content-Type", "text/html");
    response.end(`<!doctype html><iframe id="w" src="${baseURL}/embed" style="width:390px;height:200px;border:0"></iframe>
      <script>window.heights=[];addEventListener("message",e=>{if(e.data&&e.data.type==="tilawah:resize")window.heights.push(e.data.height)})</script>`);
  });
  await new Promise<void>((resolve) => host.listen(0, "127.0.0.1", resolve));
  try {
    await page.goto(`http://127.0.0.1:${(host.address() as AddressInfo).port}/`);
    const frame = page.frameLocator("#w");
    await frame.getByRole("button", { name: /^Al-Fatihah/ }).click();
    await expect(frame.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
    await expect.poll(() => page.evaluate(() => (window as unknown as { heights: number[] }).heights.at(-1) ?? 0)).toBeGreaterThan(300);
    // The app gave no host, so the widget names the page that embeds it.
    expect(sent[0]).toEqual({ event: "view", host: "127.0.0.1" });
  } finally {
    await new Promise((resolve) => host.close(resolve));
  }
});

test("counts one view per load, one play per surah, and each click through to the site", async ({ page }) => {
  await mockAudio(page);
  await page.goto("/embed?host=metrokoi-app");
  await expect.poll(() => sent).toEqual([{ event: "view", host: "metrokoi-app" }]);

  await surahButton(page, "Al-Fatihah").click();
  await expect.poll(() => sent.filter((s) => s.event === "play")).toHaveLength(1);
  await page.getByRole("button", { name: "Pause", exact: true }).first().click();
  await page.getByRole("button", { name: "Play", exact: true }).first().click();
  await surahButton(page, "Al-Baqarah").click();
  await expect.poll(() => sent.filter((s) => s.event === "play")).toHaveLength(2);
  await surahButton(page, "Al-Fatihah").click();
  await page.waitForTimeout(500);
  expect(sent.filter((s) => s.event === "play")).toHaveLength(2);

  await page.getByRole("link", { name: /^View full details/ }).evaluate((a) => a.addEventListener("click", (e) => e.preventDefault()));
  await page.getByRole("link", { name: /^View full details/ }).click();
  await page.getByRole("link", { name: "Powered by Tilawah" }).evaluate((a) => a.addEventListener("click", (e) => e.preventDefault()));
  await page.getByRole("link", { name: "Powered by Tilawah" }).click();
  await expect.poll(() => sent.filter((s) => s.event === "click")).toHaveLength(2);
  expect(sent.filter((s) => s.event === "view")).toHaveLength(1);
  expect(sent.every((s) => s.host === "metrokoi-app")).toBe(true);
});

test("does not count a play for a surah that is only remembered from last time", async ({ page }) => {
  await mockAudio(page);
  await page.goto("/embed");
  await surahButton(page, "Ya-Sin").click();
  await page.getByRole("button", { name: "Pause", exact: true }).first().click();
  sent.length = 0;
  await page.reload();
  await expect(page.getByRole("region", { name: "Audio player" }).getByRole("heading", { name: "Ya-Sin" })).toBeVisible();
  await expect.poll(() => sent.map((s) => s.event)).toEqual(["view"]);
});

test("embed.js adds a frame with the chosen options and sizes it to the widget", async ({ page, baseURL }) => {
  const host = createServer((_, response) => {
    response.setHeader("Content-Type", "text/html");
    response.end(`<!doctype html><body style="margin:0"><p>Host page</p>
      <script src="${baseURL}/embed.js" data-theme="dark" data-lang="bn" data-reciter="30" data-accent="#c2410c" data-host="my-app"></script></body>`);
  });
  await new Promise<void>((resolve) => host.listen(0, "127.0.0.1", resolve));
  try {
    await page.goto(`http://127.0.0.1:${(host.address() as AddressInfo).port}/`);
    const frame = page.locator("iframe[title=Tilawah]");
    const src = new URL((await frame.getAttribute("src"))!);
    expect(src.pathname).toBe("/embed");
    expect(Object.fromEntries(src.searchParams)).toEqual({ theme: "dark", lang: "bn", reciter: "30", accent: "#c2410c", host: "my-app" });
    await expect(frame).toHaveAttribute("allow", /autoplay/);
    await expect(page.frameLocator("iframe[title=Tilawah]").getByRole("heading", { name: "সূরাসমূহ" })).toBeVisible();
    await expect.poll(async () => (await frame.boundingBox())?.height ?? 0).not.toBe(640);
    expect((await frame.boundingBox())!.height).toBeGreaterThan(300);
  } finally {
    await new Promise((resolve) => host.close(resolve));
  }
});

test("embed.js ignores size messages from anything but its own frame", async ({ page, baseURL }) => {
  const host = createServer((_, response) => {
    response.setHeader("Content-Type", "text/html");
    response.end(`<!doctype html><body><script src="${baseURL}/embed.js" data-size="compact"></script></body>`);
  });
  await new Promise<void>((resolve) => host.listen(0, "127.0.0.1", resolve));
  try {
    await page.goto(`http://127.0.0.1:${(host.address() as AddressInfo).port}/`);
    const frame = page.locator("iframe[title=Tilawah]");
    await expect(page.frameLocator("iframe[title=Tilawah]").getByRole("region", { name: "Audio player" })).toBeVisible();
    await expect.poll(async () => (await frame.boundingBox())?.height ?? 0).toBeLessThan(400);
    const before = (await frame.boundingBox())!.height;
    await page.evaluate(() => window.postMessage({ type: "tilawah:resize", height: 5000 }, "*"));
    await page.waitForTimeout(300);
    expect((await frame.boundingBox())!.height).toBe(before);
  } finally {
    await new Promise((resolve) => host.close(resolve));
  }
});

test("serves embed.js to any site", async ({ request }) => {
  const response = await request.get("/embed.js");
  expect(response.status()).toBe(200);
  expect(response.headers()["access-control-allow-origin"]).toBe("*");
});

test("keeps the embed page out of the site: not linked, not in the sitemap, and /widget is not a page", async ({ page, request }) => {
  const response = await request.get("/widget");
  expect(response.status()).toBe(404);
  const sitemap = await (await request.get("/sitemap.xml")).text();
  expect(sitemap).not.toMatch(/embed/i);
  expect(sitemap).toContain("/widgets");
  expect(await (await request.get("/robots.txt")).text()).toContain("Disallow: /embed");

  for (const path of ["/", "/player", "/surahs", "/reciters", "/library", "/stats"]) {
    await page.goto(path);
    await expect(page.locator('a[href*="embed"], a[href*="widget"]')).toHaveCount(0);
  }
});
