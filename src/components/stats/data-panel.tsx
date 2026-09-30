"use client";

import { DownloadIcon, RotateCcwIcon, UploadIcon } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { importBackupFile, resetAllData, saveBackupFile } from "@/lib/backup";

export function DataPanel() {
  const t = useTranslations("data");
  const fileInput = useRef<HTMLInputElement>(null);
  const [resetOpen, setResetOpen] = useState(false);

  const onFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      await importBackupFile(file);
      toast.success(t("imported"));
    } catch {
      toast.error(t("importError"));
    }
  };

  return (
    <section aria-labelledby="data-heading" className="flex flex-col gap-4 rounded-2xl border bg-card p-5">
      <div className="flex flex-col gap-1">
        <h2 id="data-heading" className="text-lg font-semibold">
          {t("title")}
        </h2>
        <p className="max-w-prose text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          onClick={() => {
            saveBackupFile();
            toast.success(t("exported"));
          }}
        >
          <DownloadIcon />
          {t("export")}
        </Button>
        <Button variant="outline" onClick={() => fileInput.current?.click()}>
          <UploadIcon />
          {t("import")}
        </Button>
        <input ref={fileInput} type="file" accept="application/json,.json" className="sr-only" tabIndex={-1} aria-hidden onChange={onFile} />
        <Button variant="destructive" onClick={() => setResetOpen(true)}>
          <RotateCcwIcon />
          {t("reset")}
        </Button>
      </div>
      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title={t("resetTitle")}
        description={t("resetDescription")}
        confirmLabel={t("resetConfirm")}
        cancelLabel={t("cancel")}
        destructive
        onConfirm={() => {
          resetAllData();
          toast(t("resetDone"));
        }}
      />
    </section>
  );
}
