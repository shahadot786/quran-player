"use client";

import { useId, useState, type FormEvent } from "react";
import { ArrowDownIcon, ArrowUpIcon, PlusIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { moveItem } from "@/lib/utils";
import { MAX_COUNT, validateGroup } from "@/lib/zikir/validate";
import type { GroupView, ItemView } from "@/lib/zikir/view";
import { useZikirStore } from "@/stores/zikir-store";
import { CountField } from "./count-field";
import { useZikirText } from "./use-zikir-text";

const DEFAULT_TARGET = 33;
const DEFAULT_GOAL = 1;

type StepDraft = { key: string; itemId: string; target: string };

const selectClass =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-background px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export function GroupEditor({ open, onOpenChange, initial }: { open: boolean; onOpenChange: (open: boolean) => void; initial?: GroupView }) {
  const t = useTranslations("zikir.editor");
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>{initial ? t("groupTitleEdit") : t("groupTitleNew")}</SheetTitle>
          <SheetDescription>{t("description")}</SheetDescription>
        </SheetHeader>
        {open && <GroupForm key={initial?.id ?? "new"} initial={initial} onDone={() => onOpenChange(false)} />}
      </SheetContent>
    </Sheet>
  );
}

function GroupForm({ initial, onDone }: { initial?: GroupView; onDone: () => void }) {
  const t = useTranslations("zikir");
  const ids = useId();
  const { allItems, itemView } = useZikirText();
  const options = allItems();
  const [name, setName] = useState(initial?.name ?? "");
  const [steps, setSteps] = useState<StepDraft[]>(() => (initial?.steps ?? []).map((step) => ({ key: crypto.randomUUID(), itemId: step.itemId, target: String(step.target) })));
  const [hasGoal, setHasGoal] = useState(Boolean(initial?.dailyGoal));
  const [dailyGoal, setDailyGoal] = useState(String(initial?.dailyGoal ?? DEFAULT_GOAL));
  const [submitted, setSubmitted] = useState(false);

  // A step can point at an item that is hidden or removed since; keep it selectable so the group isn't silently changed.
  const optionsFor = (itemId: string): Pick<ItemView, "id" | "name">[] =>
    options.some((option) => option.id === itemId) ? options : [...options, { id: itemId, name: itemView(itemId)?.name ?? "–" }];

  const errors = validateGroup({ name, steps: steps.map((step) => ({ itemId: step.itemId, target: Number(step.target) })), hasGoal, dailyGoal: Number(dailyGoal) });
  const showErrors = submitted && Object.keys(errors).length > 0;

  const update = (key: string, change: Partial<StepDraft>) => setSteps((list) => list.map((step) => (step.key === key ? { ...step, ...change } : step)));
  const addStep = () => {
    const first = options[0];
    if (!first) return;
    setSteps((list) => [...list, { key: crypto.randomUUID(), itemId: first.id, target: String(first.target ?? DEFAULT_TARGET) }]);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    const input = { name, steps: steps.map((step) => ({ itemId: step.itemId, target: Number(step.target) })), dailyGoal: hasGoal ? Number(dailyGoal) : null };
    const store = useZikirStore.getState();
    if (initial) store.updateGroup(initial.id, input);
    else store.createGroup(input);
    toast.success(initial ? t("toast.saved") : t("toast.created"));
    onDone();
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-1 flex-col">
      <div className="flex flex-col gap-5 p-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor={`${ids}-name`}>{t("editor.name")}</Label>
          <Input
            id={`${ids}-name`}
            autoFocus
            value={name}
            maxLength={60}
            placeholder={t("editor.namePlaceholder")}
            aria-invalid={showErrors && errors.name ? true : undefined}
            aria-describedby={showErrors && errors.name ? `${ids}-name-error` : undefined}
            onChange={(event) => setName(event.target.value)}
          />
          {showErrors && errors.name && (
            <p id={`${ids}-name-error`} className="text-sm text-destructive">
              {t("editor.nameRequired")}
            </p>
          )}
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="mb-1 text-sm font-medium">{t("editor.steps")}</legend>
          <ol className="flex flex-col gap-3">
            {steps.map((step, index) => {
              const number = index + 1;
              return (
                <li key={step.key} className="flex flex-col gap-2 rounded-xl border p-3">
                  <select aria-label={t("editor.stepItem", { number })} value={step.itemId} className={selectClass} onChange={(event) => update(step.key, { itemId: event.target.value })}>
                    {optionsFor(step.itemId).map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                  <div className="flex items-end gap-2">
                    <div className="flex flex-1 flex-col gap-1">
                      <Label htmlFor={`${ids}-target-${step.key}`} className="sr-only">
                        {t("editor.stepTarget", { number })}
                      </Label>
                      <Input
                        id={`${ids}-target-${step.key}`}
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={MAX_COUNT}
                        step={1}
                        aria-label={t("editor.stepTarget", { number })}
                        value={step.target}
                        onChange={(event) => update(step.key, { target: event.target.value })}
                      />
                    </div>
                    <Button type="button" variant="ghost" size="icon" disabled={index === 0} aria-label={t("editor.moveUp", { number })} onClick={() => setSteps((list) => moveItem(list, index, index - 1))}>
                      <ArrowUpIcon />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" disabled={index === steps.length - 1} aria-label={t("editor.moveDown", { number })} onClick={() => setSteps((list) => moveItem(list, index, index + 1))}>
                      <ArrowDownIcon />
                    </Button>
                    <Button type="button" variant="ghost" size="icon" aria-label={t("editor.removeStep", { number })} onClick={() => setSteps((list) => list.filter((entry) => entry.key !== step.key))}>
                      <XIcon />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ol>
          {showErrors && errors.steps && (
            <p role="alert" className="text-sm text-destructive">
              {errors.steps === "empty" ? t("editor.stepsEmpty") : t("editor.stepsInvalid")}
            </p>
          )}
          <Button type="button" variant="outline" onClick={addStep}>
            <PlusIcon />
            {t("editor.addStep")}
          </Button>
        </fieldset>

        <div className="flex flex-col gap-3 rounded-xl border p-3">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor={`${ids}-goalswitch`}>{t("editor.goalSwitch")}</Label>
            <Switch id={`${ids}-goalswitch`} checked={hasGoal} onCheckedChange={setHasGoal} />
          </div>
          {hasGoal && <CountField id={`${ids}-goal`} label={t("editor.goalRounds")} value={dailyGoal} onChange={setDailyGoal} error={showErrors && errors.dailyGoal ? t("editor.numberInvalid") : undefined} />}
        </div>
      </div>

      <SheetFooter className="mt-auto flex-row justify-end border-t">
        <Button type="button" variant="outline" onClick={onDone}>
          {t("editor.cancel")}
        </Button>
        <Button type="submit">{initial ? t("editor.save") : t("editor.create")}</Button>
      </SheetFooter>
    </form>
  );
}
