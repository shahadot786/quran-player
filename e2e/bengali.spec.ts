import { expect, test, type Page } from "@playwright/test";

// A Bengali page that mixes up a number and a pre-formatted digit string shows "NaN", which English never reveals.
async function bengali(page: Page) {
  await page.context().addCookies([{ name: "NEXT_LOCALE", value: "bn", url: "http://localhost:3100" }]);
  await page.addInitScript(() => {
    if (localStorage.getItem("e2e-bn-seeded")) return;
    localStorage.setItem("e2e-bn-seeded", "1");
    const day = (offset: number) => {
      const d = new Date();
      d.setDate(d.getDate() - offset);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    };
    const base = { arabic: "", transliteration: "", meaning: "", createdAt: 1, updatedAt: 1, deletedAt: null };
    localStorage.setItem(
      "qp-zikir",
      JSON.stringify({
        version: 1,
        state: {
          items: [{ ...base, id: "w", name: "Wird", target: 50, dailyGoal: 20 }],
          groups: [{ ...base, id: "g", name: "Pair", steps: [{ itemId: "w", target: 2 }], dailyGoal: 2 }],
          counts: { [day(0)]: { w: { phone: { n: 25, at: 1 } } }, [day(1)]: { w: { phone: { n: 30, at: 1 } } } },
          runs: { "item:w": { kind: "item", id: "w", step: 0, count: 5, startedAt: 1, updatedAt: 1 } },
          history: [{ id: "h", kind: "item", refId: "w", name: "Wird", count: 33, finishedAt: Date.now() - 60_000, completed: true }],
          builtIns: {},
          settings: { view: "simple", sound: false, haptics: false, keepAwake: false },
        },
      }),
    );
    localStorage.setItem("qp-stats", JSON.stringify({ version: 0, state: { totalSeconds: 4000, daily: { a: 2000, b: 2000 }, reciters: {}, completed: {} } }));
  });
}

for (const path of ["/zikir", "/zikir/w", "/zikir/g", "/progress", "/stats", "/library"]) {
  test(`shows no NaN on ${path} in Bengali`, async ({ page }) => {
    await bengali(page);
    await page.goto(path);
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("NaN");
  });
}

test("shows no NaN on the zikir stats and history tabs in Bengali", async ({ page }) => {
  await bengali(page);
  await page.goto("/zikir");
  for (const index of [1, 2]) {
    await page.getByRole("tab").nth(index).click();
    await expect(page.locator("body")).not.toContainText("NaN");
  }
  await expect(page.getByRole("tab").nth(2)).toHaveAttribute("aria-selected", "true");
  await expect(page.getByText(/৩৩ বার/)).toBeVisible();
});

test("shows the morning and evening adhkar in Bengali, with no English left in the Hisnul Muslim cards", async ({ page }) => {
  await page.context().addCookies([{ name: "NEXT_LOCALE", value: "bn", url: "http://localhost:3100" }]);
  await page.goto("/zikir");
  await expect(page.getByRole("heading", { name: "সকালের জিকির" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "সন্ধ্যার জিকির" })).toBeVisible();
  const hisn = page.getByRole("region", { name: "হিসনুল মুসলিম" });
  await expect(hisn.getByRole("heading", { name: "আয়াতুল কুরসি" })).toBeVisible();
  const text = await hisn.innerText();
  const latin = text.split("\n").filter((line) => /[A-Za-z]/.test(line));
  expect(latin).toEqual([]);
  await expect(page.locator("body")).not.toContainText("NaN");
});
