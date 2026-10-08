"use client";

import { useState } from "react";
import { PlusIcon, Undo2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
import { StatTile } from "@/components/stat-tile";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocalizedNumber } from "@/hooks/use-localized-number";
import { localDateKey } from "@/lib/format";
import { dayTotal } from "@/lib/zikir/stats";
import type { GroupView, ItemView } from "@/lib/zikir/view";
import { useHydrated } from "@/stores/hydration";
import { useZikirStore } from "@/stores/zikir-store";
import { GroupEditor } from "./group-editor";
import { HistoryList } from "./history-list";
import { ItemEditor } from "./item-editor";
import { useZikirText } from "./use-zikir-text";
import { ZikirCard } from "./zikir-card";
import { ZikirStats } from "./zikir-stats";

type Editing = { kind: "item"; view?: ItemView } | { kind: "group"; view?: GroupView } | null;
type Deleting = { kind: "item"; view: ItemView } | { kind: "group"; view: GroupView } | null;

export function ZikirHome() {
  const t = useTranslations("zikir");
  const common = useTranslations("common");
  const n = useLocalizedNumber();
  const hydrated = useHydrated();
  const counts = useZikirStore((s) => s.counts);
  const text = useZikirText();
  const [editing, setEditing] = useState<Editing>(null);
  const [deleting, setDeleting] = useState<Deleting>(null);

  if (!hydrated) {
    return (
      <div role="status" aria-label={common("loading")} className="flex flex-col gap-4">
        <Skeleton className="h-24 rounded-2xl" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  const items = text.allItems();
  const groups = text.allGroups();
  const hasCustom = items.some((item) => !item.builtIn) || groups.some((group) => !group.builtIn);
  const store = useZikirStore.getState();

  const duplicateItem = (view: ItemView) => {
    store.createItem({ name: t("copyName", { name: view.name }), arabic: view.arabic, transliteration: view.transliteration, meaning: view.meaning, target: view.target, dailyGoal: view.dailyGoal });
    toast.success(t("toast.duplicated"));
  };
  const duplicateGroup = (view: GroupView) => {
    store.createGroup({ name: t("copyName", { name: view.name }), steps: view.steps.map(({ itemId, target }) => ({ itemId, target })), dailyGoal: view.dailyGoal });
    toast.success(t("toast.duplicated"));
  };

  const confirmDelete = () => {
    if (!deleting) return;
    if (deleting.kind === "group") {
      store.deleteGroup(deleting.view.id);
      toast(t("toast.deleted"));
      return;
    }
    const result = store.deleteItem(deleting.view.id);
    if (result.ok) toast(t("toast.deleted"));
    else if (result.reason === "in-use") toast.error(t("delete.inUse", { name: deleting.view.name, groups: result.groups.join(", ") }));
  };

  return (
    <Tabs defaultValue="library" className="gap-6">
      <TabsList>
        <TabsTrigger value="library">{t("tabs.library")}</TabsTrigger>
        <TabsTrigger value="stats">{t("tabs.stats")}</TabsTrigger>
        <TabsTrigger value="history">{t("tabs.history")}</TabsTrigger>
      </TabsList>

      <TabsContent value="library" className="flex flex-col gap-8">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,16rem)_1fr] sm:items-center">
        <StatTile label={t("today")} value={n(dayTotal(counts, localDateKey()))} />
        <div className="flex flex-wrap gap-2 sm:justify-end">
          <Button onClick={() => setEditing({ kind: "item" })}>
            <PlusIcon />
            {t("newZikir")}
          </Button>
          <Button variant="outline" onClick={() => setEditing({ kind: "group" })}>
            <PlusIcon />
            {t("newGroup")}
          </Button>
          {text.removedCount > 0 && (
            <Button
              variant="ghost"
              onClick={() => {
                store.restoreBuiltIns();
                toast.success(t("toast.restored"));
              }}
            >
              <Undo2Icon />
              {t("restore.button", { count: n(text.removedCount) })}
            </Button>
          )}
        </div>
      </div>

      {!hasCustom && <EmptyState>{t("emptyCustom")}</EmptyState>}

      <section aria-labelledby="zikir-groups-heading" className="flex flex-col gap-4">
        <h2 id="zikir-groups-heading" className="text-lg font-semibold">
          {t("sections.groups")}
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {groups.map((view) => (
            <ZikirCard key={view.id} kind="group" view={view} onEdit={() => setEditing({ kind: "group", view })} onDuplicate={() => duplicateGroup(view)} onDelete={() => setDeleting({ kind: "group", view })} />
          ))}
        </ul>
      </section>

      <section aria-labelledby="zikir-items-heading" className="flex flex-col gap-4">
        <h2 id="zikir-items-heading" className="text-lg font-semibold">
          {t("sections.items")}
        </h2>
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((view) => (
            <ZikirCard key={view.id} kind="item" view={view} onEdit={() => setEditing({ kind: "item", view })} onDuplicate={() => duplicateItem(view)} onDelete={() => setDeleting({ kind: "item", view })} />
          ))}
        </ul>
      </section>
      </TabsContent>

      <TabsContent value="stats">
        <ZikirStats />
      </TabsContent>
      <TabsContent value="history">
        <HistoryList />
      </TabsContent>

      <ItemEditor open={editing?.kind === "item"} onOpenChange={(open) => !open && setEditing(null)} initial={editing?.kind === "item" ? editing.view : undefined} />
      <GroupEditor open={editing?.kind === "group"} onOpenChange={(open) => !open && setEditing(null)} initial={editing?.kind === "group" ? editing.view : undefined} />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={deleting ? t(deleting.kind === "item" ? "delete.itemTitle" : "delete.groupTitle", { name: deleting.view.name }) : ""}
        description={deleting?.view.builtIn ? `${t("delete.description")} ${t("delete.builtInHint")}` : t("delete.description")}
        confirmLabel={t("delete.confirm")}
        cancelLabel={t("editor.cancel")}
        destructive
        onConfirm={confirmDelete}
      />
    </Tabs>
  );
}
