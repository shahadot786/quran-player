"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { trackUrl } from "@/lib/audio-url";
import { getLocalizedSurahName } from "@/lib/bengali-data";
import { downloadsSupported, fetchFileSize, storageEstimate } from "@/lib/downloads";
import { formatBytes } from "@/lib/format";
import { getSurah } from "@/lib/surahs";
import type { Track } from "@/lib/types";
import { useDownloadsStore } from "@/stores/downloads-store";

type Info = { size: number | null; usage: number; quota: number } | null;

export function DownloadDialog({ track, open, onOpenChange }: { track: Track; open: boolean; onOpenChange: (open: boolean) => void }) {
  const t = useTranslations("downloads");
  const locale = useLocale();
  const [info, setInfo] = useState<Info>(null);
  const surah = getSurah(track.surah);
  const name = surah ? getLocalizedSurahName(surah, locale) : String(track.surah);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    Promise.all([fetchFileSize(trackUrl(track)), storageEstimate()]).then(([size, estimate]) => {
      if (!cancelled) setInfo({ size, usage: estimate?.usage ?? 0, quota: estimate?.quota ?? 0 });
    });
    return () => {
      cancelled = true;
    };
  }, [open, track]);

  const lowStorage = info?.size && info.quota ? info.quota - info.usage < info.size * 1.2 : false;
  const description = [
    info?.size ? t("confirmDescription", { size: formatBytes(info.size) }) : t("unknownSize"),
    info?.quota ? t("storage", { used: formatBytes(info.usage), quota: formatBytes(info.quota) }) : null,
    lowStorage ? t("lowStorage") : null,
  ]
    .filter(Boolean)
    .join(" ");

  const confirm = () => {
    if (!downloadsSupported()) {
      toast.error(t("unsupported"));
      return;
    }
    useDownloadsStore
      .getState()
      .start(track)
      .then(() => toast.success(t("done", { name })))
      .catch(() => toast.error(t("failed")));
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("confirmTitle", { name })}
      description={description}
      confirmLabel={t("confirm")}
      cancelLabel={t("cancel")}
      onConfirm={confirm}
    />
  );
}
