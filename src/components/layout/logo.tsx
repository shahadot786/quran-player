import Link from "next/link";
import { useTranslations } from "next-intl";

export function Logo() {
  const t = useTranslations("app");
  return (
    <Link href="/" className="group flex items-center gap-2.5 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
      <span aria-hidden className="grid size-9 place-items-center rounded-xl bg-primary font-arabic text-xl leading-none text-primary-foreground">
        ت
      </span>
      <span className="text-lg font-semibold tracking-tight">{t("name")}</span>
    </Link>
  );
}
