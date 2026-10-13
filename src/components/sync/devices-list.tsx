"use client";

import { PencilIcon, SmartphoneIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDeviceId } from "@/lib/device";
import { describeDevice } from "@/lib/sync/device-label";
import type { DeviceEntry } from "@/lib/sync/types";
import { useSyncStore } from "@/stores/sync-store";
import { DeviceNameDialog } from "./device-name-dialog";

type Row = { id: string; entry: DeviceEntry; mine: boolean };

// This device first, then the others by when they last synced.
export function deviceRows(devices: Record<string, DeviceEntry>, thisId: string): Row[] {
  return Object.entries(devices)
    .filter(([, entry]) => !entry.removed)
    .map(([id, entry]) => ({ id, entry, mine: id === thisId }))
    .sort((a, b) => Number(b.mine) - Number(a.mine) || b.entry.syncedAt - a.entry.syncedAt || (a.id < b.id ? -1 : 1));
}

export function DevicesList() {
  const t = useTranslations("sync.devices");
  const tSync = useTranslations("sync");
  const locale = useLocale();
  const devices = useSyncStore((state) => state.devices);
  const lastSyncedAt = useSyncStore((state) => state.lastSyncedAt);
  const [renaming, setRenaming] = useState(false);
  const [removing, setRemoving] = useState<Row | null>(null);
  const thisId = getDeviceId();
  const automatic = describeDevice(typeof navigator === "undefined" ? "" : navigator.userAgent);
  const rows = deviceRows(devices, thisId);
  const format = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" });

  return (
    <section aria-labelledby="devices-heading" className="flex flex-col gap-3 border-t pt-4">
      <div className="flex flex-col gap-1">
        <h3 id="devices-heading" className="font-medium">
          {t("title")}
        </h3>
        <p className="max-w-prose text-sm text-muted-foreground">{t("description")}</p>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {rows.map((row) => (
            <li key={row.id} className="flex items-center gap-3 rounded-xl border p-3">
              <SmartphoneIcon aria-hidden className="size-5 shrink-0 text-muted-foreground" />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="flex flex-wrap items-center gap-2">
                  <span className="truncate font-medium">{row.entry.name}</span>
                  {row.mine && <Badge variant="secondary">{t("thisDevice")}</Badge>}
                </span>
                {/* This device's entry is written when a sync starts, so its time comes from the last sync that finished. */}
                <span className="text-sm text-muted-foreground">
                  {row.mine && lastSyncedAt === null ? tSync("neverSynced") : t("lastSynced", { time: format.format(row.mine ? lastSyncedAt! : row.entry.syncedAt) })}
                </span>
              </div>
              {row.mine ? (
                <Button variant="ghost" size="icon-sm" aria-label={t("renameFor", { name: row.entry.name })} onClick={() => setRenaming(true)}>
                  <PencilIcon />
                </Button>
              ) : (
                <Button variant="ghost" size="icon-sm" aria-label={t("removeFor", { name: row.entry.name })} onClick={() => setRemoving(row)}>
                  <Trash2Icon />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      <DeviceNameDialog
        open={renaming}
        onOpenChange={setRenaming}
        current={devices[thisId]?.name ?? automatic}
        automatic={automatic}
        onSave={(name) => {
          useSyncStore.getState().renameDevice(thisId, name, automatic);
          setRenaming(false);
        }}
      />
      <ConfirmDialog
        open={removing !== null}
        onOpenChange={(open) => !open && setRemoving(null)}
        title={t("removeTitle", { name: removing?.entry.name ?? "" })}
        description={t("removeDescription")}
        confirmLabel={t("removeConfirm")}
        cancelLabel={tSync("cancel")}
        onConfirm={() => {
          if (removing) useSyncStore.getState().removeDevice(removing.id);
          toast(t("removed"));
        }}
      />
    </section>
  );
}
