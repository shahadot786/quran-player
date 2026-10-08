"use client";

import { useTranslations } from "next-intl";
import { useLocalizedNumber } from "./use-localized-number";

const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;

export function useDuration() {
  const t = useTranslations("stats");
  const n = useLocalizedNumber();
  return (seconds: number) => {
    const totalMinutes = Math.floor(Math.max(0, seconds) / SECONDS_PER_MINUTE);
    return totalMinutes >= MINUTES_PER_HOUR
      ? t("hours", { hours: n(Math.floor(totalMinutes / MINUTES_PER_HOUR)), minutes: n(totalMinutes % MINUTES_PER_HOUR) })
      : t("mins", { minutes: n(totalMinutes) });
  };
}
