"use client";

import { CloudIcon, KeyRoundIcon, RefreshCwIcon, Trash2Icon } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Button } from "@/components/ui/button";
import { cleanKey, isLegacyKey } from "@/lib/sync/key";
import { useHydrated } from "@/stores/hydration";
import { useSyncStore } from "@/stores/sync-store";
import { AutoSyncRow } from "./auto-sync-row";
import { ChangeCodeDialog } from "./change-code-dialog";
import { DevicesList } from "./devices-list";
import { KeyPanel } from "./key-panel";
import { RestoreDialog } from "./restore-dialog";
import { useSync, type SyncResult } from "./use-sync";

export function SyncCard() {
  const t = useTranslations("sync");
  const locale = useLocale();
  const hydrated = useHydrated();
  const syncKey = useSyncStore((state) => state.key);
  const lastSyncedAt = useSyncStore((state) => state.lastSyncedAt);
  const { busy, sync, restore, change, deleteCloud } = useSync();
  const [restoreOpen, setRestoreOpen] = useState(false);
  const [changeOpen, setChangeOpen] = useState(false);
  const [fromLink, setFromLink] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [message, setMessage] = useState("");

  // A link made by "Copy link" carries the code after the #, which never reaches a server; it only fills in the restore form.
  // The form opens a tick later, once the page is up, so the server and browser render the same first frame.
  useEffect(() => {
    const match = /^#code=(.+)$/.exec(window.location.hash);
    if (!match) return;
    const code = cleanKey(decodeURIComponent(match[1]!));
    const timer = window.setTimeout(() => {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
      if (!code) return;
      setFromLink(code.replace(/-/g, " "));
      setRestoreOpen(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const report = (result: SyncResult, success: string) => {
    const text = result.ok ? success : t(`errors.${result.error}`);
    setMessage(text);
    if (result.ok) toast.success(text);
    else toast.error(text);
  };

  const lastSynced = lastSyncedAt
    ? t("lastSynced", { time: new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(lastSyncedAt) })
    : t("neverSynced");

  return (
    <section id="sync" aria-labelledby="sync-heading" className="flex scroll-mt-6 flex-col gap-4 rounded-2xl border bg-card p-5">
      <div className="flex flex-col gap-1">
        <h2 id="sync-heading" className="text-lg font-semibold">
          {t("title")}
        </h2>
        <p className="max-w-prose text-sm text-muted-foreground">{t("description")}</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button disabled={!hydrated || busy !== null} onClick={async () => report(await sync(), t("synced"))}>
          {busy === "sync" ? <RefreshCwIcon className="animate-spin motion-reduce:animate-none" /> : <CloudIcon />}
          {busy === "sync" ? t("syncing") : t("syncNow")}
        </Button>
        <p className="text-sm text-muted-foreground">{lastSynced}</p>
      </div>
      <p role="status" aria-live="polite" className="sr-only">
        {message}
      </p>
      {hydrated && <AutoSyncRow />}
      {hydrated && syncKey && isLegacyKey(syncKey) && (
        <div className="flex flex-col gap-2 rounded-xl bg-gold/15 p-4 text-sm">
          <p className="font-medium">{t("change.legacyTitle")}</p>
          <p>{t("change.legacyBody")}</p>
          <div>
            <Button size="sm" variant="outline" onClick={() => setChangeOpen(true)}>
              {t("change.legacyAction")}
            </Button>
          </div>
        </div>
      )}
      {hydrated && syncKey && <KeyPanel syncKey={syncKey} onChange={() => setChangeOpen(true)} />}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" disabled={busy !== null} onClick={() => setRestoreOpen(true)}>
          <KeyRoundIcon />
          {t("restore.open")}
        </Button>
        <Button variant="destructive" disabled={busy !== null} onClick={() => setDeleteOpen(true)}>
          <Trash2Icon />
          {t("delete.open")}
        </Button>
      </div>
      {hydrated && <DevicesList />}
      <p className="max-w-prose text-xs text-muted-foreground">{t("privacy")}</p>
      <ChangeCodeDialog
        open={changeOpen}
        onOpenChange={setChangeOpen}
        busy={busy === "change"}
        onChange={async (code) => {
          const result = await change(code);
          if (result.ok) report(result, t("change.done"));
          return result;
        }}
      />
      <RestoreDialog
        key={fromLink}
        initialValue={fromLink}
        open={restoreOpen}
        onOpenChange={setRestoreOpen}
        busy={busy === "restore"}
        onRestore={async (text) => {
          const result = await restore(text);
          if (result.ok) report(result, t("restore.done"));
          return result;
        }}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t("delete.title")}
        description={t("delete.description")}
        confirmLabel={t("delete.confirm")}
        cancelLabel={t("cancel")}
        destructive
        onConfirm={async () => report(await deleteCloud(), t("delete.done"))}
      />
    </section>
  );
}
