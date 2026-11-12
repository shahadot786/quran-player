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

const reciterButton = (page: Page) => page.getByRole("button", { name: /^Change reciter/ });
const reciterSearch = (page: Page) => page.getByRole("combobox", { name: "Filter reciters" });
const reciterOptions = (page: Page) => page.getByRole("listbox", { name: "Choose a reciter" }).getByRole("option");

test("changes the reciter from a searchable list and keeps the surah", async ({ page }) => {
  await mockAudio(page);
  await page.goto("/embed");
  await expect(reciterButton(page)).toContainText("Mishary Alafasi");
  await surahButton(page, "Ya-Sin").click();
  await reciterButton(page).click();
  await expect(reciterSearch(page)).toBeFocused();
  await reciterSearch(page).fill("ghamdi");
  await reciterOptions(page).filter({ hasText: "Saad Al-Ghamdi" }).click();
  await expect(reciterButton(page)).toContainText("Saad Al-Ghamdi");
  await expect(page.getByRole("region", { name: "Audio player" }).getByRole("heading", { name: "Ya-Sin" })).toBeVisible();
  await expect(page.getByRole("region", { name: "Audio player" })).toContainText("Saad Al-Ghamdi");
});

test("offers every reciter in a floating, fixed-height list that scrolls", async ({ page, request }) => {
  const total = ((await (await request.get("/api/reciters")).json()) as unknown[]).length;
  expect(total).toBeGreaterThan(100);
  await page.goto("/embed");
  const widgetHeight = () => page.locator("main").evaluate((el) => el.getBoundingClientRect().height);
  const before = await widgetHeight();
  await reciterButton(page).click();
  await expect(reciterOptions(page)).toHaveCount(total);
  expect(await widgetHeight()).toBe(before);

  const list = page.getByRole("listbox", { name: "Choose a reciter" });
  const box = (await list.boundingBox())!;
  expect(box.height).toBeLessThan(260);
  expect(await list.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
  await list.evaluate((el) => el.scrollTo(0, el.scrollHeight));
  await expect(reciterOptions(page).last()).toBeInViewport();

  const brand = (await page.getByText("Tilawah", { exact: true }).first().boundingBox())!;
  const trigger = (await reciterButton(page).boundingBox())!;
  expect(Math.abs(brand.y - trigger.y)).toBeLessThan(30);
  expect(box.y).toBeGreaterThan(trigger.y + trigger.height);
  expect(box.width).toBeGreaterThan(trigger.width);
});

test("searches reciters by English or Bengali name and says when nothing matches", async ({ page }) => {
  await page.goto("/embed");
  await reciterButton(page).click();
  await reciterSearch(page).fill("hussary");
  await expect(reciterOptions(page).first()).toContainText("Hussary");
  expect(await reciterOptions(page).count()).toBeLessThan(10);
  await reciterSearch(page).fill("মিশারি");
  await expect(reciterOptions(page).filter({ hasText: "Mishary Alafasi" })).toHaveCount(1);
  await reciterSearch(page).fill("zzzzzz");
  await expect(page.getByText("No reciter matches “zzzzzz”.")).toBeVisible();

  await page.goto("/embed?lang=bn");
  await page.getByRole("button", { name: /^ক্বারী বদলান/ }).click();
  await page.getByRole("combobox", { name: "ক্বারী ফিল্টার করুন" }).fill("মিশারি");
  await expect(page.getByRole("listbox").getByRole("option").first()).toContainText("মিশারি");
});

test("moves through reciters with the keyboard and closes with Escape", async ({ page }) => {
  await page.goto("/embed");
  await reciterButton(page).focus();
  await page.keyboard.press("Enter");
  await expect(reciterSearch(page)).toBeFocused();
  await reciterSearch(page).fill("saad");
  await expect(reciterOptions(page).first()).toBeVisible();
  expect(await reciterOptions(page).count()).toBeGreaterThan(1);
  await reciterSearch(page).fill("saad al-ghamdi");
  await expect(reciterOptions(page)).toHaveCount(1);
  await page.keyboard.press("Enter");
  await expect(reciterButton(page)).toContainText("Saad Al-Ghamdi");
  await expect(reciterButton(page)).toBeFocused();

  await page.keyboard.press("Enter");
  await expect(reciterOptions(page).filter({ hasText: "Saad Al-Ghamdi" })).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Escape");
  await expect(reciterSearch(page)).toHaveCount(0);
  await expect(reciterButton(page)).toBeFocused();
});

test("starts on any reciter the host asks for, and ignores one that does not exist", async ({ page, request }) => {
  const all = (await (await request.get("/api/reciters")).json()) as { id: number; name: string }[];
  const other = all.find((reciter) => ![123, 30, 92, 31, 4].includes(reciter.id))!;
  await page.goto(`/embed?reciter=${other.id}`);
  await expect(reciterButton(page)).toContainText(other.name);
  await page.goto("/embed?reciter=30");
  await expect(reciterButton(page)).toContainText("Saad Al-Ghamdi");
  await page.goto("/embed?reciter=999999");
  await expect(reciterButton(page)).toContainText("Mishary Alafasi");
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

test("opens the Quran player on the main site in a new tab", async ({ page }) => {
  await mockAudio(page);
  await page.goto("/embed?host=metrokoi-app");
  const link = page.getByRole("link", { name: /^View full details/ });
  await expect(link).toHaveAttribute("target", "_blank");
  await expect(link).toHaveAttribute("rel", /noopener/);
  const before = new URL((await link.getAttribute("href"))!);
  expect(before.pathname).toBe("/player");
  expect(before.searchParams.get("utm_source")).toBe("widget");
  expect(before.searchParams.get("utm_medium")).toBe("metrokoi-app");

  await surahButton(page, "Ya-Sin").click();
  expect(new URL((await link.getAttribute("href"))!).pathname).toBe("/player");
  expect(new URL((await page.getByRole("link", { name: "Powered by Tilawah" }).getAttribute("href"))!).pathname).toBe("/");
});

const picker = (page: Page) => page.getByRole("region", { name: "Audio player" }).getByRole("button", { name: /Choose a surah/ });
const search = (page: Page) => page.getByRole("combobox", { name: "Search surahs" });
const options = (page: Page) => page.getByRole("listbox", { name: "Choose a surah" }).getByRole("option");

test("gives the player-only size a surah dropdown under the play button, closed until opened", async ({ page }) => {
  await page.goto("/embed?size=compact");
  const player = page.getByRole("region", { name: "Audio player" });
  await expect(picker(page)).toBeVisible();
  await expect(picker(page)).toHaveAttribute("aria-expanded", "false");
  await expect(search(page)).toHaveCount(0);
  expect((await player.getByRole("button", { name: "Play", exact: true }).boundingBox())!.y).toBeLessThan((await picker(page).boundingBox())!.y);
});

test("opens a search box and a list with a fixed height that scrolls", async ({ page }) => {
  await page.goto("/embed?size=compact");
  await picker(page).click();
  await expect(picker(page)).toHaveAttribute("aria-expanded", "true");
  await expect(search(page)).toBeFocused();
  await expect(options(page)).toHaveCount(114);

  const list = page.getByRole("listbox", { name: "Choose a surah" });
  const box = (await list.boundingBox())!;
  expect(box.height).toBeLessThan(260);
  expect(await list.evaluate((el) => el.scrollHeight > el.clientHeight)).toBe(true);
  await list.evaluate((el) => el.scrollTo(0, el.scrollHeight));
  await expect(options(page).last()).toBeInViewport();
  expect((await list.boundingBox())!.height).toBe(box.height);

  await search(page).fill("yasin");
  await expect(options(page)).toHaveCount(1);
  expect((await list.boundingBox())!.height).toBe(box.height);
});

test("finds a surah by name, meaning, number or Arabic and plays the one chosen", async ({ page }) => {
  await mockAudio(page);
  await page.goto("/embed?size=compact");
  const player = page.getByRole("region", { name: "Audio player" });

  await picker(page).click();
  await search(page).fill("ya-sin");
  await options(page).first().click();
  await expect(player.getByRole("heading", { name: "Ya-Sin" })).toBeVisible();
  await expect(player.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  await expect(search(page)).toHaveCount(0);
  await expect(picker(page)).toContainText("36. Ya-Sin");

  await picker(page).click();
  await search(page).fill("the cow");
  await expect(options(page)).toHaveText([/2\. Al-Baqarah/]);
  await search(page).fill("2");
  await expect(options(page).first()).toContainText("2. Al-Baqarah");
  await search(page).fill("الفاتحة");
  await expect(options(page)).toHaveText([/1\. Al-Fatihah/]);
  await search(page).fill("zzzz");
  await expect(page.getByText("No surah matches “zzzz”.")).toBeVisible();
  await expect(options(page)).toHaveCount(0);
});

test("can be used with the keyboard alone", async ({ page }) => {
  await mockAudio(page);
  await page.goto("/embed?size=compact");
  const player = page.getByRole("region", { name: "Audio player" });
  await picker(page).focus();
  await page.keyboard.press("Enter");
  await expect(search(page)).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  await expect(search(page)).toHaveAttribute("aria-activedescendant", /option-3$/);
  await page.keyboard.press("Enter");
  await expect(player.getByRole("heading", { name: "Ali 'Imran" })).toBeVisible();
  await expect(picker(page)).toBeFocused();

  await page.keyboard.press("Enter");
  await expect(options(page).filter({ hasText: "3. Ali 'Imran" })).toHaveAttribute("aria-selected", "true");
  await expect(search(page)).toHaveAttribute("aria-activedescendant", /option-3$/);
  await expect(options(page).nth(2)).toBeInViewport();
  await page.keyboard.press("Escape");
  await expect(search(page)).toHaveCount(0);
  await expect(picker(page)).toBeFocused();
});

test("closes when you click elsewhere, and follows the surah when you press next", async ({ page }) => {
  await mockAudio(page);
  await page.goto("/embed?size=compact");
  await picker(page).click();
  await page.getByRole("heading", { name: "Choose a surah to start listening" }).click();
  await expect(search(page)).toHaveCount(0);

  await picker(page).click();
  await options(page).nth(35).click();
  const player = page.getByRole("region", { name: "Audio player" });
  await player.getByRole("button", { name: "Next surah" }).click();
  await expect(picker(page)).toContainText("37.");
});

test("shows the picker in Bengali, and only at the player-only size", async ({ page }) => {
  await page.goto("/embed?size=compact&lang=bn");
  const trigger = page.getByRole("button", { name: "একটি সূরা বেছে নিন" });
  await expect(trigger).toBeVisible();
  await trigger.click();
  await expect(page.getByRole("listbox").getByRole("option").first()).toContainText("১. ");
  await page.getByRole("combobox", { name: "সূরা অনুসন্ধান" }).fill("৩৬");
  await expect(page.getByRole("listbox").getByRole("option").first()).toContainText("৩৬.");

  await page.goto("/embed");
  await expect(page.getByRole("combobox")).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Choose a surah/ })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Surahs" })).toBeVisible();
});

test("shows the Kaaba animation as a background in the player, without adding any space", async ({ page }) => {
  await mockAudio(page);
  await page.goto("/embed");
  const player = page.getByRole("region", { name: "Audio player" });
  const background = player.locator("svg").first();
  await expect(background).toBeVisible();
  const kaaba = player.locator('svg g[transform="translate(760, 195)"]');
  await expect(kaaba).toBeVisible();

  const layer = await background.evaluate((svg) => {
    const wrapper = svg.parentElement!;
    const style = getComputedStyle(wrapper);
    return { position: style.position, pointerEvents: style.pointerEvents, hidden: wrapper.getAttribute("aria-hidden") };
  });
  expect(layer).toEqual({ position: "absolute", pointerEvents: "none", hidden: "true" });

  const card = (await player.boundingBox())!;
  const label = (await player.getByText("Now playing").boundingBox())!;
  expect(label.y - card.y).toBeLessThan(28);
  await expect(player.getByRole("button", { name: "Play", exact: true })).toBeEnabled();
});

test("keeps the Kaaba fully inside the player at narrow, phone and wide sizes", async ({ page }) => {
  for (const width of [280, 390, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/embed");
    const player = page.getByRole("region", { name: "Audio player" });
    const kaaba = (await player.locator('svg g[transform="translate(760, 195)"]').boundingBox())!;
    const card = (await player.boundingBox())!;
    expect(kaaba.x, `${width}px left`).toBeGreaterThanOrEqual(card.x);
    expect(kaaba.x + kaaba.width, `${width}px right`).toBeLessThanOrEqual(card.x + card.width);
    expect(kaaba.y, `${width}px top`).toBeGreaterThanOrEqual(card.y);
    expect(kaaba.y + kaaba.height, `${width}px bottom`).toBeLessThanOrEqual(card.y + card.height);
    expect(kaaba.width, `${width}px visible`).toBeGreaterThan(20);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `${width}px overflow`).toBe(true);
  }
});

test("animates the Kaaba's ripples only while audio plays", async ({ page }) => {
  await mockAudio(page);
  await page.goto("/embed");
  const player = page.getByRole("region", { name: "Audio player" });
  const ripple = player.locator("svg ellipse").first();
  const animation = () => ripple.evaluate((el) => getComputedStyle(el).animationName);
  expect(await animation()).toBe("none");

  await surahButton(page, "Al-Fatihah").click();
  await expect(player.getByRole("button", { name: "Pause", exact: true })).toBeVisible();
  await expect.poll(animation).toBe("ping");

  await player.getByRole("button", { name: "Pause", exact: true }).click();
  await expect.poll(animation).toBe("none");
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

test("opening a list never changes the widget's size, so the host's frame does not move", async ({ page, baseURL }) => {
  const host = createServer((_, response) => {
    response.setHeader("Content-Type", "text/html");
    response.end(`<!doctype html><body><script src="${baseURL}/embed.js" data-size="compact"></script>
      <script>window.heights=[];addEventListener("message",e=>{if(e.data&&e.data.type==="tilawah:resize")window.heights.push(e.data.height)})</script></body>`);
  });
  await new Promise<void>((resolve) => host.listen(0, "127.0.0.1", resolve));
  try {
    await page.goto(`http://127.0.0.1:${(host.address() as AddressInfo).port}/`);
    const frame = page.locator("iframe[title=Tilawah]");
    const inside = page.frameLocator("iframe[title=Tilawah]");
    await expect(inside.getByRole("button", { name: /Choose a surah/ })).toBeVisible();
    await expect.poll(async () => (await frame.boundingBox())?.height ?? 0).toBeLessThan(400);
    await page.waitForTimeout(500);
    const heights = () => page.evaluate(() => (window as unknown as { heights: number[] }).heights.length);
    const closed = (await frame.boundingBox())!.height;
    const messages = await heights();

    await inside.getByRole("button", { name: /Choose a surah/ }).click();
    await expect(inside.getByRole("combobox", { name: "Search surahs" })).toBeVisible();
    await inside.getByRole("combobox", { name: "Search surahs" }).fill("ya");
    await page.waitForTimeout(400);
    expect((await frame.boundingBox())!.height).toBe(closed);
    expect(await heights()).toBe(messages);

    await inside.getByRole("combobox", { name: "Search surahs" }).press("Escape");
    await expect(inside.getByRole("combobox", { name: "Search surahs" })).toHaveCount(0);
    await page.waitForTimeout(400);
    expect((await frame.boundingBox())!.height).toBe(closed);
    expect(await heights()).toBe(messages);
  } finally {
    await new Promise((resolve) => host.close(resolve));
  }
});

test("keeps a list inside a small fixed-size frame by flipping and shrinking it", async ({ page, baseURL }) => {
  const host = createServer((_, response) => {
    response.setHeader("Content-Type", "text/html");
    response.end(`<!doctype html><body style="margin:0"><iframe id="w" src="${baseURL}/embed?size=compact" style="width:390px;height:320px;border:0;display:block"></iframe></body>`);
  });
  await new Promise<void>((resolve) => host.listen(0, "127.0.0.1", resolve));
  try {
    await page.goto(`http://127.0.0.1:${(host.address() as AddressInfo).port}/`);
    const frame = page.locator("#w");
    const inside = page.frameLocator("#w");
    const bounds = (await frame.boundingBox())!;
    const within = async (name: string, panel: ReturnType<typeof inside.getByRole>) => {
      const box = (await panel.boundingBox())!;
      expect(box.y, `${name} top`).toBeGreaterThanOrEqual(bounds.y - 1);
      expect(box.y + box.height, `${name} bottom`).toBeLessThanOrEqual(bounds.y + bounds.height + 1);
      expect(box.height, `${name} still usable`).toBeGreaterThan(100);
    };

    await inside.getByRole("button", { name: /Choose a surah/ }).click();
    await within("surah list", inside.getByRole("listbox", { name: "Choose a surah" }));
    await inside.getByRole("combobox", { name: "Search surahs" }).press("Escape");

    await inside.getByRole("button", { name: /^Change reciter/ }).click();
    await within("reciter list", inside.getByRole("listbox", { name: "Choose a reciter" }));
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
