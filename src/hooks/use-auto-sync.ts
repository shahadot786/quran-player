"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { httpApi, SyncError, type SyncApi } from "@/lib/sync/client";
import { shouldAutoSync } from "@/lib/sync/auto";
import { isSyncing, syncNow } from "@/lib/sync/perform";
import { localDateKey } from "@/lib/format";
import { useHydrated } from "@/stores/hydration";
import { useSyncStore } from "@/stores/sync-store";

/** Syncs once a day, the first time the app is open that day, and says so; a tab left open past midnight counts as a new day when it comes back into view. */
export function useAutoSync(api: SyncApi = httpApi) {
  const t = useTranslations("sync");
  const hydrated = useHydrated();

  useEffect(() => {
    if (!hydrated) return;

    const run = async () => {
      const { auto, key, lastSyncedAt } = useSyncStore.getState();
      const now = new Date();
      if (!shouldAutoSync({ auto, key, lastSyncedAt, now, online: navigator.onLine, running: isSyncing() })) return;
      try {
        await syncNow(api);
        toast.success(t("auto.done"), { description: t("auto.doneHint") });
      } catch (error) {
        // One notice a day is enough; the next open or the return of the connection tries again.
        const day = localDateKey(now);
        if (useSyncStore.getState().autoFailedDay === day) return;
        useSyncStore.getState().noteAutoFailure(day);
        const code = error instanceof SyncError ? error.code : "server";
        toast.error(t("auto.failed"), { description: `${t(`errors.${code}`)} ${t("auto.failedHint")}` });
      }
    };

    const onVisible = () => {
      if (document.visibilityState === "visible") void run();
    };
    void run();
    window.addEventListener("online", run);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("online", run);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [hydrated, api, t]);
}
