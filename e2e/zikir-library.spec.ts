import { expect, test, type Locator, type Page } from "@playwright/test";
import { goToPage } from "./helpers";

const card = (page: Page, name: string): Locator => page.getByRole("listitem").filter({ has: page.getByRole("heading", { name, exact: true }) });

async function createZikir(page: Page, name: string, target = "10") {
  await page.getByRole("button", { name: "New zikir" }).click();
  const sheet = page.getByRole("dialog");
  await sheet.getByLabel("Name", { exact: true }).fill(name);
  await sheet.getByLabel("Count up to").fill(target);
  await sheet.getByRole("button", { name: "Create" }).click();
  await expect(sheet).toBeHidden();
}

test.beforeEach(async ({ page }) => {
  await page.goto("/zikir");
  await expect(page.getByRole("heading", { name: "Zikir", level: 1 })).toBeVisible();
});

test("lists the built-in groups and zikir, and keeps unconfirmed ones hidden", async ({ page }) => {
  await expect(card(page, "After salah")).toContainText("3 steps · 100 counts");
  await expect(card(page, "Istighfar and salawat")).toBeVisible();
  await expect(card(page, "SubhanAllah")).toContainText("33 counts");
  await expect(card(page, "SubhanAllah").getByText("سُبْحَانَ اللَّهِ")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Morning adhkar" })).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Ayat al-Kursi" })).toHaveCount(0);
  await expect(card(page, "SubhanAllah").getByRole("button", { name: "Options for SubhanAllah" })).toBeVisible();
});

test("creates a zikir that stays after a reload", async ({ page }) => {
  await createZikir(page, "Morning wird", "10");
  await expect(card(page, "Morning wird")).toContainText("10 counts");
  await page.reload();
  await expect(card(page, "Morning wird")).toBeVisible();
});

test("explains what is missing before saving", async ({ page }) => {
  await page.getByRole("button", { name: "New zikir" }).click();
  const sheet = page.getByRole("dialog");
  await sheet.getByLabel("Count up to").fill("0");
  await sheet.getByRole("button", { name: "Create" }).click();
  await expect(sheet.getByText("Give it a name.")).toBeVisible();
  await expect(sheet.getByText("Enter a whole number from 1 to 100,000.")).toBeVisible();
  await expect(sheet.getByLabel("Name", { exact: true })).toHaveAttribute("aria-invalid", "true");
  await sheet.getByLabel("Name", { exact: true }).fill("Fixed");
  await sheet.getByLabel("Count up to").fill("5");
  await sheet.getByRole("button", { name: "Create" }).click();
  await expect(card(page, "Fixed")).toBeVisible();
});

test("counts without a limit when asked to", async ({ page }) => {
  await page.getByRole("button", { name: "New zikir" }).click();
  const sheet = page.getByRole("dialog");
  await sheet.getByLabel("Name", { exact: true }).fill("Free count");
  await sheet.getByRole("switch", { name: "Count without a limit" }).click();
  await expect(sheet.getByLabel("Count up to")).toBeHidden();
  await sheet.getByRole("button", { name: "Create" }).click();
  await expect(card(page, "Free count")).toContainText("No limit");
});

test("edits a custom zikir but not a built-in one", async ({ page }) => {
  await createZikir(page, "Mine");
  await card(page, "Mine").getByRole("button", { name: "Options for Mine" }).click();
  await page.getByRole("menuitem", { name: "Edit" }).click();
  const sheet = page.getByRole("dialog");
  await expect(sheet.getByLabel("Name", { exact: true })).toHaveValue("Mine");
  await sheet.getByLabel("Name", { exact: true }).fill("Mine, renamed");
  await sheet.getByRole("button", { name: "Save" }).click();
  await expect(card(page, "Mine, renamed")).toBeVisible();

  await card(page, "SubhanAllah").getByRole("button", { name: "Options for SubhanAllah" }).click();
  await expect(page.getByRole("menuitem", { name: "Edit" })).toHaveCount(0);
  await expect(page.getByRole("menuitem", { name: "Duplicate" })).toBeVisible();
});

test("duplicates a built-in zikir into one that can be edited", async ({ page }) => {
  await card(page, "SubhanAllah").getByRole("button", { name: "Options for SubhanAllah" }).click();
  await page.getByRole("menuitem", { name: "Duplicate" }).click();
  const copy = card(page, "SubhanAllah (copy)");
  await expect(copy).toContainText("33 counts");
  await expect(copy.getByText("سُبْحَانَ اللَّهِ")).toBeVisible();
  await copy.getByRole("button", { name: "Options for SubhanAllah (copy)" }).click();
  await expect(page.getByRole("menuitem", { name: "Edit" })).toBeVisible();
});

test("builds a group from steps and reorders them", async ({ page }) => {
  await page.getByRole("button", { name: "New group" }).click();
  const sheet = page.getByRole("dialog");
  await sheet.getByLabel("Name", { exact: true }).fill("My evening");
  await sheet.getByRole("button", { name: "Create" }).click();
  await expect(sheet.getByText("Add at least one step.")).toBeVisible();

  await sheet.getByRole("button", { name: "Add step" }).click();
  await sheet.getByRole("button", { name: "Add step" }).click();
  await sheet.getByLabel("Zikir for step 2").selectOption({ label: "Alhamdulillah" });
  await sheet.getByLabel("Count for step 2").fill("5");
  await sheet.getByRole("button", { name: "Move step 2 up" }).click();
  await expect(sheet.getByLabel("Zikir for step 1")).toHaveValue("builtin:alhamdulillah");
  await expect(sheet.getByLabel("Count for step 1")).toHaveValue("5");
  await expect(sheet.getByRole("button", { name: "Move step 1 up" })).toBeDisabled();

  await sheet.getByRole("button", { name: "Create" }).click();
  await expect(card(page, "My evening")).toContainText("2 steps · 38 counts");
  await expect(card(page, "My evening")).toContainText("Alhamdulillah → SubhanAllah");
});

test("will not delete a zikir that a group uses, and says which group", async ({ page }) => {
  await createZikir(page, "Shared");
  await page.getByRole("button", { name: "New group" }).click();
  const sheet = page.getByRole("dialog");
  await sheet.getByLabel("Name", { exact: true }).fill("Uses shared");
  await sheet.getByRole("button", { name: "Add step" }).click();
  await sheet.getByLabel("Zikir for step 1").selectOption({ label: "Shared" });
  await sheet.getByRole("button", { name: "Create" }).click();
  await expect(card(page, "Uses shared")).toBeVisible();

  await card(page, "Shared").getByRole("button", { name: "Options for Shared" }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("“Shared” is used by Uses shared. Remove it from those groups first.")).toBeVisible();
  await expect(card(page, "Shared")).toBeVisible();
});

test("deletes a zikir after confirming", async ({ page }) => {
  await createZikir(page, "Temporary");
  await card(page, "Temporary").getByRole("button", { name: "Options for Temporary" }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog.getByText("Delete “Temporary”?")).toBeVisible();
  await dialog.getByRole("button", { name: "Delete" }).click();
  await expect(card(page, "Temporary")).toHaveCount(0);
  await page.reload();
  await expect(card(page, "Temporary")).toHaveCount(0);
});

test("is reachable from the navigation and fits the screen", async ({ page, isMobile }) => {
  await page.goto("/");
  await goToPage(page, isMobile, "Zikir");
  await expect(page).toHaveURL(/\/zikir$/);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(0);
});

test("deletes a built-in zikir by hiding it, and brings it back on request", async ({ page }) => {
  await card(page, "Allahu Akbar").getByRole("button", { name: "Options for Allahu Akbar" }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog.getByText("Delete “Allahu Akbar”?")).toBeVisible();
  await expect(dialog.getByText(/It is built in, so it is only hidden/)).toBeVisible();
  await dialog.getByRole("button", { name: "Delete" }).click();
  await expect(card(page, "Allahu Akbar")).toHaveCount(0);

  await page.reload();
  await expect(card(page, "Allahu Akbar")).toHaveCount(0);
  await page.goto("/zikir/builtin%3AallahuAkbar");
  await expect(page.getByText("This zikir isn’t available anymore.")).toBeVisible();

  await page.goto("/zikir");
  await page.getByRole("button", { name: "Restore removed zikir (1)" }).click();
  await expect(card(page, "Allahu Akbar")).toBeVisible();
  await expect(page.getByRole("button", { name: /Restore removed zikir/ })).toHaveCount(0);
});

test("deletes a built-in group", async ({ page }) => {
  await card(page, "After salah").getByRole("button", { name: "Options for After salah" }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
  await expect(card(page, "After salah")).toHaveCount(0);
  await expect(card(page, "SubhanAllah")).toBeVisible();
});

test("deletes from the counter page and returns to the library", async ({ page }) => {
  await createZikir(page, "From counter");
  await card(page, "From counter").getByRole("link", { name: "Count" }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  const dialog = page.getByRole("alertdialog");
  await expect(dialog.getByText("Delete “From counter”?")).toBeVisible();
  await expect(dialog.getByText(/only hidden/)).toHaveCount(0);
  await dialog.getByRole("button", { name: "Delete" }).click();
  await expect(page).toHaveURL(/\/zikir$/);
  await expect(card(page, "From counter")).toHaveCount(0);
});

test("will not delete from the counter page while a group uses the zikir", async ({ page }) => {
  await card(page, "SubhanAllah").getByRole("button", { name: "Options for SubhanAllah" }).click();
  await page.getByRole("menuitem", { name: "Duplicate" }).click();
  await card(page, "After salah").getByRole("button", { name: "Options for After salah" }).click();
  await page.getByRole("menuitem", { name: "Duplicate" }).click();
  await card(page, "After salah (copy)").getByRole("button", { name: "Options for After salah (copy)" }).click();
  await page.getByRole("menuitem", { name: "Edit" }).click();
  const sheet = page.getByRole("dialog");
  await sheet.getByLabel("Zikir for step 1").selectOption({ label: "SubhanAllah (copy)" });
  await sheet.getByRole("button", { name: "Save" }).click();

  await card(page, "SubhanAllah (copy)").getByRole("link", { name: "Count" }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("“SubhanAllah (copy)” is used by After salah (copy). Remove it from those groups first.")).toBeVisible();
  await expect(page).toHaveURL(/\/zikir\/[0-9a-f-]{36}$/);
});
