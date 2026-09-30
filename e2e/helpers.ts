import { expect, type Locator, type Page } from "@playwright/test";

const SAMPLE_RATE = 8000;
export const AUDIO_SECONDS = 120;

function silentWav() {
  const dataLength = SAMPLE_RATE * AUDIO_SECONDS;
  const buffer = Buffer.alloc(44 + dataLength, 0x80);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write("WAVEfmt ", 8);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE, 28);
  buffer.writeUInt16LE(1, 32);
  buffer.writeUInt16LE(8, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataLength, 40);
  return buffer;
}

export async function mockAudio(page: Page) {
  const body = silentWav();
  await page.route("**/*.mp3", async (route) => {
    const headers = { "Content-Type": "audio/wav", "Accept-Ranges": "bytes" };
    const range = /bytes=(\d+)-(\d*)/.exec(route.request().headers()["range"] ?? "");
    if (!range) return route.fulfill({ status: 200, headers, body });
    const start = Number(range[1]);
    const end = range[2] ? Number(range[2]) : body.length - 1;
    return route.fulfill({
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${body.length}` },
      body: body.subarray(start, end + 1),
    });
  });
}

export async function openPlayer(page: Page, isMobile: boolean): Promise<Locator> {
  if (isMobile && !page.url().endsWith("/player")) {
    await page.getByRole("link", { name: "Open full player" }).click();
    await expect(page).toHaveURL(/\/player$/);
  }
  return page.getByRole("region", { name: "Audio player" });
}

export async function playFirstSurah(page: Page) {
  const button = page.getByRole("button", { name: /^Play (?!all$)/ }).first();
  const name = (await button.getAttribute("aria-label"))!.replace(/^Play /, "");
  await button.click();
  return name;
}

const FATIHA_AYAHS = 7;

// Seven equal ayahs spanning the stubbed two-minute clip, so the active ayah at any second is predictable.
export function fatihaTimings(lastEnd = AUDIO_SECONDS) {
  const length = lastEnd / FATIHA_AYAHS;
  return {
    preamble: null,
    ayahs: Array.from({ length: FATIHA_AYAHS }, (_, i) => ({ ayah: i + 1, start: i * length, end: (i + 1) * length })),
  };
}

export async function mockQuranText(page: Page) {
  const ayahs = (label: string) => Array.from({ length: FATIHA_AYAHS }, (_, i) => ({ numberInSurah: i + 1, text: `${label} ${i + 1}` }));
  await page.route("**/api.alquran.cloud/**", (route) =>
    route.fulfill({ json: { code: 200, status: "OK", data: [{ number: 1, name: "الفاتحة", ayahs: ayahs("آية") }, { number: 1, ayahs: ayahs("অনুবাদ") }] } }),
  );
}
