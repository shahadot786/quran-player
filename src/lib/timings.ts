export type AyahTiming = { ayah: number; start: number; end: number };
export type SurahTimings = { preamble: { start: number; end: number } | null; ayahs: AyahTiming[] };

const MS = 1000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function toAyahs(rows: { ayah: number; from: number; to: number }[], versesCount: number): AyahTiming[] | null {
  if (rows.length !== versesCount) return null;
  let previousStart = 0;
  const ayahs: AyahTiming[] = [];
  for (const [index, row] of rows.entries()) {
    const valid = row.ayah === index + 1 && Number.isFinite(row.from) && Number.isFinite(row.to) && row.from >= previousStart && row.to > row.from;
    if (!valid) return null;
    previousStart = row.from;
    ayahs.push({ ayah: row.ayah, start: row.from / MS, end: row.to / MS });
  }
  return ayahs;
}

// Timings that don't line up with every ayah would highlight the wrong verse, so anything irregular is rejected whole.
export function parseMp3QuranTimings(rows: unknown, versesCount: number): SurahTimings | null {
  if (!Array.isArray(rows)) return null;
  const parsed = rows.map((row) => (isRecord(row) ? { ayah: Number(row.ayah), from: Number(row.start_time), to: Number(row.end_time) } : null));
  if (parsed.some((row) => row === null)) return null;
  const all = parsed as { ayah: number; from: number; to: number }[];

  // Ayah 0 is the isti'adha/basmalah recorded before the first ayah.
  const [first, ...rest] = all;
  const hasPreamble = first?.ayah === 0;
  const ayahs = toAyahs(hasPreamble ? rest : all, versesCount);
  if (!ayahs) return null;
  const preamble = hasPreamble && first.to > first.from && first.from >= 0 ? { start: first.from / MS, end: first.to / MS } : null;
  if (hasPreamble && !preamble) return null;
  return { preamble, ayahs };
}

export function parseQuranComTimings(timestamps: unknown, surah: number, versesCount: number): SurahTimings | null {
  if (!Array.isArray(timestamps)) return null;
  const rows = timestamps.map((row) => {
    const [chapter, verse] = isRecord(row) && typeof row.verse_key === "string" ? row.verse_key.split(":").map(Number) : [];
    return chapter === surah && isRecord(row) ? { ayah: verse ?? Number.NaN, from: Number(row.timestamp_from), to: Number(row.timestamp_to) } : null;
  });
  if (rows.some((row) => row === null)) return null;
  const ayahs = toAyahs(rows as { ayah: number; from: number; to: number }[], versesCount);
  return ayahs ? { preamble: null, ayahs } : null;
}

// Returns the index of the ayah being recited, 0 meaning the preamble; ayahs are numbered from 1.
export function activeAyahAt(timings: SurahTimings, time: number): number | null {
  const { preamble, ayahs } = timings;
  if (ayahs.length === 0) return null;
  if (time < ayahs[0]!.start) return preamble ? 0 : ayahs[0]!.ayah;
  let low = 0;
  let high = ayahs.length - 1;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (ayahs[mid]!.start <= time) low = mid;
    else high = mid - 1;
  }
  return ayahs[low]!.ayah;
}

// Measured on 236 real files: matching timings end 1-2s before the audio does (trailing silence), while timings made for a
// different recording are off by tens of seconds or more. Audio can't end before the last ayah does, so shortfall is capped tightly.
const MAX_SHORTFALL_SECONDS = 2;
const MAX_TRAILING_SECONDS = 6;
const TRAILING_RATIO = 0.005;

// A timing file that doesn't span the audio was made for a different recording, so it can't be trusted.
export function fitsDuration(timings: SurahTimings, duration: number) {
  if (!Number.isFinite(duration) || duration <= 0) return true;
  const trailing = duration - timings.ayahs.at(-1)!.end;
  return trailing >= -MAX_SHORTFALL_SECONDS && trailing <= MAX_TRAILING_SECONDS + duration * TRAILING_RATIO;
}

export function timingsUrl(track: { moshafId: number; server: string; surah: number }) {
  const params = new URLSearchParams({ moshaf: String(track.moshafId), server: track.server, surah: String(track.surah) });
  return `/api/timings?${params}`;
}
