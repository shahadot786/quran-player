import { CloudIcon } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";

export async function SyncLink() {
  const t = await getTranslations("sync");
  return (
    <Button asChild variant="outline" className="self-start sm:self-auto">
      <Link href="/stats#sync">
        <CloudIcon />
        {t("link")}
      </Link>
    </Button>
  );
}
