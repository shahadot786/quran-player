"use client";

import { useLocale } from "next-intl";
import { toBengaliDigits } from "@/lib/bengali-data";

// Message arguments aren't number-formatted by the i18n library, so digits are converted before they go in.
export function useLocalizedNumber() {
  const locale = useLocale();
  return (value: number | string) => (locale === "bn" ? toBengaliDigits(value) : String(value));
}
