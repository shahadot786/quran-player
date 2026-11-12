import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SiteShell } from "@/components/layout/site-shell";
import { StatusMessage } from "@/components/status-message";
import { Button } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("errors");
  return (
    <SiteShell>
      <StatusMessage title={t("notFoundTitle")} description={t("notFoundDescription")}>
        <Button asChild>
          <Link href="/">{t("goHome")}</Link>
        </Button>
      </StatusMessage>
    </SiteShell>
  );
}
