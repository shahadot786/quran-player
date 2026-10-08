"use client";

import { useId, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { validateItem } from "@/lib/zikir/validate";
import type { ItemView } from "@/lib/zikir/view";
import { useZikirStore } from "@/stores/zikir-store";
import { CountField } from "./count-field";

const DEFAULT_TARGET = 33;
const DEFAULT_GOAL = 100;

export function ItemEditor({ open, onOpenChange, initial }: { open: boolean; onOpenChange: (open: boolean) => void; initial?: ItemView }) {
  const t = useTranslations("zikir.editor");
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-md">
        <SheetHeader className="border-b">
          <SheetTitle>{initial ? t("itemTitleEdit") : t("itemTitleNew")}</SheetTitle>
          <SheetDescription>{t("description")}</SheetDescription>
        </SheetHeader>
        {open && <ItemForm key={initial?.id ?? "new"} initial={initial} onDone={() => onOpenChange(false)} />}
      </SheetContent>
    </Sheet>
  );
}

function ItemForm({ initial, onDone }: { initial?: ItemView; onDone: () => void }) {
  const t = useTranslations("zikir");
  const ids = useId();
  const [name, setName] = useState(initial?.name ?? "");
  const [arabic, setArabic] = useState(initial?.arabic ?? "");
  const [transliteration, setTransliteration] = useState(initial?.transliteration ?? "");
  const [meaning, setMeaning] = useState(initial?.meaning ?? "");
  const [limited, setLimited] = useState(initial ? initial.target !== null : true);
  const [target, setTarget] = useState(String(initial?.target ?? DEFAULT_TARGET));
  const [hasGoal, setHasGoal] = useState(Boolean(initial?.dailyGoal));
  const [dailyGoal, setDailyGoal] = useState(String(initial?.dailyGoal ?? DEFAULT_GOAL));
  const [submitted, setSubmitted] = useState(false);

  const errors = validateItem({ name, arabic, transliteration, meaning, limited, target: Number(target), hasGoal, dailyGoal: Number(dailyGoal) });
  const showErrors = submitted && Object.keys(errors).length > 0;

  const submit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    if (Object.keys(errors).length > 0) return;
    const input = { name, arabic, transliteration, meaning, target: limited ? Number(target) : null, dailyGoal: hasGoal ? Number(dailyGoal) : null };
    const store = useZikirStore.getState();
    if (initial) store.updateItem(initial.id, input);
    else store.createItem(input);
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

        <div className="flex flex-col gap-2">
          <Label htmlFor={`${ids}-arabic`}>{t("editor.arabic")}</Label>
          <Textarea id={`${ids}-arabic`} value={arabic} maxLength={2000} rows={3} lang="ar" dir="rtl" className="font-arabic text-xl" onChange={(event) => setArabic(event.target.value)} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={`${ids}-translit`}>{t("editor.transliteration")}</Label>
          <Input id={`${ids}-translit`} value={transliteration} maxLength={300} onChange={(event) => setTransliteration(event.target.value)} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor={`${ids}-meaning`}>{t("editor.meaning")}</Label>
          <Textarea id={`${ids}-meaning`} value={meaning} maxLength={500} rows={2} onChange={(event) => setMeaning(event.target.value)} />
        </div>

        <div className="flex flex-col gap-3 rounded-xl border p-3">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor={`${ids}-nolimit`}>{t("editor.noLimit")}</Label>
            <Switch id={`${ids}-nolimit`} checked={!limited} onCheckedChange={(value) => setLimited(!value)} />
          </div>
          {limited && <CountField id={`${ids}-target`} label={t("editor.target")} value={target} onChange={setTarget} error={showErrors && errors.target ? t("editor.numberInvalid") : undefined} />}
        </div>

        <div className="flex flex-col gap-3 rounded-xl border p-3">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor={`${ids}-goalswitch`}>{t("editor.goalSwitch")}</Label>
            <Switch id={`${ids}-goalswitch`} checked={hasGoal} onCheckedChange={setHasGoal} />
          </div>
          {hasGoal && <CountField id={`${ids}-goal`} label={t("editor.goal")} value={dailyGoal} onChange={setDailyGoal} error={showErrors && errors.dailyGoal ? t("editor.numberInvalid") : undefined} />}
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
