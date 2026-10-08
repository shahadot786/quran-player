// Small shares keep a decimal so early progress doesn't read as zero, and a started surah never shows as 0%.
export function formatPercent(ratio: number): string {
  const value = Math.min(100, Math.max(0, ratio * 100));
  if (value === 0) return "0";
  if (value < 10) return Math.max(0.1, Math.floor(value * 10) / 10).toFixed(1);
  return String(Math.floor(value));
}
