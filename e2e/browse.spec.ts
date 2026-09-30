import { expect, test } from "@playwright/test";

test("home links to a reciter", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "What would you like to listen to?" })).toBeVisible();
  await page.getByRole("heading", { name: "Well-loved reciters" }).scrollIntoViewIfNeeded();
  await page.getByRole("list").filter({ has: page.getByRole("link", { name: /surahs?|recitations?/ }) }).getByRole("link").first().click();
  await expect(page).toHaveURL(/\/reciters\/\d+$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("filters reciters by name", async ({ page }) => {
  await page.goto("/reciters");
  const search = page.getByRole("searchbox", { name: "Search reciters" });
  await search.fill("alafas");
  await expect(page.getByRole("link", { name: /Alafas/ }).first()).toBeVisible();
  await search.fill("zzzzzz");
  await expect(page.getByText("No reciter matches “zzzzzz”.")).toBeVisible();
  await page.getByRole("button", { name: "Clear search" }).click();
  await expect(search).toHaveValue("");
});

test("finds a surah and opens its reciter list", async ({ page }) => {
  await page.goto("/surahs");
  await page.getByRole("searchbox", { name: "Search surahs" }).fill("yasin");
  await expect(page.getByRole("link", { name: /Ya-Sin/ })).toBeVisible();
  await expect(page.getByRole("link", { name: /Al-Fatihah/ })).toBeHidden();
  await page.getByRole("link", { name: /Ya-Sin/ }).click();
  await expect(page).toHaveURL(/\/surahs\/36$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Ya-Sin");
});

test("shows the not-found page for an unknown route", async ({ page }) => {
  await page.goto("/nowhere");
  await expect(page.getByRole("heading", { name: "Page not found" })).toBeVisible();
  await page.getByRole("link", { name: "Go home" }).click();
  await expect(page).toHaveURL("/");
});
