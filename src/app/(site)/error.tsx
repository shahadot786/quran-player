"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { StatusMessage } from "@/components/status-message";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  const t = useTranslations("errors");

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <StatusMessage title={t("title")} description={t("description")}>
      <Button onClick={retry}>{t("retry")}</Button>
    </StatusMessage>
  );
}
