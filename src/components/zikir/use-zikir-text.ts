"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { getBuiltInGroup, getBuiltInItem, visibleBuiltInGroups, visibleBuiltInItems, type BuiltInGroup, type BuiltInItem } from "@/data/zikir-defaults";
import type { ZikirGroup, ZikirItem } from "@/lib/zikir/types";
import type { GroupView, ItemView } from "@/lib/zikir/view";
import { isBuiltInRemoved, useZikirStore } from "@/stores/zikir-store";

// Built-in text is looked up by the content's own key, so the typed message keys can't be used; a test checks every key exists.
type Translator = ((key: string, values?: Record<string, string | number>) => string) & { has: (key: string) => boolean };

export function useZikirText() {
  const t = useTranslations("zikir") as unknown as Translator;
  const items = useZikirStore((s) => s.items);
  const groups = useZikirStore((s) => s.groups);
  const builtIns = useZikirStore((s) => s.builtIns);

  return useMemo(() => {
    const builtInItem = (item: BuiltInItem): ItemView => ({
      id: item.id,
      name: t(`items.${item.key}.name`),
      arabic: item.arabic,
      transliteration: t.has(`items.${item.key}.transliteration`) ? t(`items.${item.key}.transliteration`) : "",
      meaning: t(`items.${item.key}.meaning`),
      target: item.target,
      dailyGoal: null,
      builtIn: true,
      collection: item.collection,
    });
    const userItem = (item: ZikirItem): ItemView => ({ ...item, builtIn: false });

    const itemView = (id: string): ItemView | undefined => {
      const builtIn = getBuiltInItem(id);
      if (builtIn) return builtInItem(builtIn);
      const custom = items.find((item) => item.id === id && item.deletedAt === null);
      return custom ? userItem(custom) : undefined;
    };

    const withSteps = (steps: { itemId: string; target: number }[]) =>
      steps.map((step) => ({ itemId: step.itemId, target: step.target, name: itemView(step.itemId)?.name ?? "" }));
    const total = (steps: { target: number }[]) => steps.reduce((sum, step) => sum + step.target, 0);

    const builtInGroup = (group: BuiltInGroup): GroupView => ({
      id: group.id,
      name: t(`groups.${group.key}.name`),
      description: t(`groups.${group.key}.description`),
      steps: withSteps(group.steps),
      dailyGoal: null,
      builtIn: true,
      total: total(group.steps),
    });
    const userGroup = (group: ZikirGroup): GroupView => ({
      id: group.id,
      name: group.name,
      description: "",
      steps: withSteps(group.steps),
      dailyGoal: group.dailyGoal,
      builtIn: false,
      total: total(group.steps),
    });

    return {
      itemView,
      groupView: (id: string): GroupView | undefined => {
        const builtIn = getBuiltInGroup(id);
        if (builtIn) return builtInGroup(builtIn);
        const custom = groups.find((group) => group.id === id && group.deletedAt === null);
        return custom ? userGroup(custom) : undefined;
      },
      allItems: (): ItemView[] => [
        ...visibleBuiltInItems().filter((item) => !isBuiltInRemoved({ builtIns }, item.id)).map(builtInItem),
        ...items.filter((item) => item.deletedAt === null).map(userItem),
      ],
      allGroups: (): GroupView[] => [
        ...visibleBuiltInGroups().filter((group) => !isBuiltInRemoved({ builtIns }, group.id)).map(builtInGroup),
        ...groups.filter((group) => group.deletedAt === null).map(userGroup),
      ],
      removedCount: Object.values(builtIns).filter((entry) => entry.removed).length,
    };
  }, [t, items, groups, builtIns]);
}
