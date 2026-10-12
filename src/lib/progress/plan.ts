import { AYAH_TOTAL, JUZS } from "./juz";

const DAY_MS = 24 * 60 * 60 * 1000;

export type PlanTarget =
  | { status: "done" }
  | { status: "overdue"; ayahsLeft: number }
  | { status: "on"; daysLeft: number; ayahsPerDay: number; parasPerDay: number; secondsPerDay: number | null };

const dayStart = (key: string) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y!, m! - 1, d!).getTime();
};

// Paras differ in length, so a daily share in paras is an average, shown as "about".
const AYAHS_PER_PARA = AYAH_TOTAL / JUZS.length;

/** What is left of the round spread evenly over the days until the finish date, today and that day included. */
export function planTarget(input: { finishBy: string; today: string; ayahsLeft: number; secondsPerAyah: number | null }): PlanTarget {
  const { finishBy, today, ayahsLeft, secondsPerAyah } = input;
  if (ayahsLeft <= 0) return { status: "done" };
  const daysLeft = Math.round((dayStart(finishBy) - dayStart(today)) / DAY_MS) + 1;
  if (daysLeft <= 0) return { status: "overdue", ayahsLeft };
  const ayahsPerDay = Math.ceil(ayahsLeft / daysLeft);
  return {
    status: "on",
    daysLeft,
    ayahsPerDay,
    parasPerDay: ayahsPerDay / AYAHS_PER_PARA,
    secondsPerDay: secondsPerAyah === null ? null : ayahsPerDay * secondsPerAyah,
  };
}
