import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { StatusMessage } from "@/components/status-message";
import { Button } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("errors");
  return (
    <StatusMessage title={t("notFoundTitle")} description={t("notFoundDescription")}>
      <Button asChild>
        <Link href="/">{t("goHome")}</Link>
      </Button>
    </StatusMessage>
  );
}
