"use client";

import { CheckIcon, CopyIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function KeyPanel({ syncKey }: { syncKey: string }) {
  const t = useTranslations("sync.key");
  const id = useId();
  const [shown, setShown] = useState(false);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(syncKey);
      setCopied(true);
      toast.success(t("copied"));
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("copyError"));
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{t("label")}</Label>
      <div className="flex flex-wrap gap-2">
        <output id={id} dir="ltr" className="min-w-0 flex-1 rounded-lg border bg-muted px-3 py-2 font-mono text-sm break-words">
          {shown ? syncKey : "•".repeat(24)}
        </output>
        <Button variant="outline" size="icon" aria-pressed={shown} aria-label={shown ? t("hide") : t("show")} onClick={() => setShown((value) => !value)}>
          {shown ? <EyeOffIcon /> : <EyeIcon />}
        </Button>
        <Button variant="outline" size="icon" aria-label={t("copy")} onClick={copy}>
          {copied ? <CheckIcon /> : <CopyIcon />}
        </Button>
      </div>
      <p className="max-w-prose text-sm text-muted-foreground">{t("warning")}</p>
    </div>
  );
}
