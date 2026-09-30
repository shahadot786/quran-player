import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { getLocalizedReciterName } from "@/lib/bengali-data";
import type { ReciterSummary } from "@/lib/types";
import { ReciterAvatar } from "./reciter-avatar";

export function ReciterCard({ reciter }: { reciter: ReciterSummary }) {
  const t = useTranslations("reciters");
  const locale = useLocale();
  const displayName = getLocalizedReciterName(reciter.name, locale);
  return (
    <Link
      href={`/reciters/${reciter.id}`}
      className="flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors outline-none hover:border-primary/40 hover:bg-accent/50 focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <ReciterAvatar name={reciter.name} />
      <span className="min-w-0">
        <span className="block truncate font-medium">{displayName}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {reciter.moshafCount > 1 ? t("recitations", { count: reciter.moshafCount }) : t("complete")}
        </span>
      </span>
    </Link>
  );
}
