"use client";

import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Segmented } from "./segmented";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "bn", label: "বাংলা" },
] as const;

export function LanguageSwitch() {
  const t = useTranslations("widgets");
  const router = useRouter();
  const locale = useLocale() === "bn" ? "bn" : "en";

  return (
    <Segmented
      label={t("langLabel")}
      value={locale}
      options={LANGUAGES}
      onChange={(next) => {
        document.cookie = `NEXT_LOCALE=${next};path=/;max-age=31536000;SameSite=Lax`;
        router.refresh();
      }}
    />
  );
}
