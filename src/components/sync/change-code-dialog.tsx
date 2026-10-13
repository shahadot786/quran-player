"use client";

import { ShuffleIcon } from "lucide-react";
import { useId, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SyncErrorCode } from "@/lib/sync/client";
import { cleanKey, codeProblem, formatKey, generateKey, isValidKey } from "@/lib/sync/key";
import type { SyncResult } from "./use-sync";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChange: (code: string) => Promise<SyncResult>;
  busy: boolean;
};

export function ChangeCodeDialog({ open, onOpenChange, onChange, busy }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>{open && <ChangeForm onChange={onChange} busy={busy} onCancel={() => onOpenChange(false)} onDone={() => onOpenChange(false)} />}</DialogContent>
    </Dialog>
  );
}

function ChangeForm({ onChange, busy, onCancel, onDone }: Pick<Props, "onChange" | "busy"> & { onCancel: () => void; onDone: () => void }) {
  const t = useTranslations("sync");
  const id = useId();
  const [value, setValue] = useState(() => formatKey(generateKey()));
  const [error, setError] = useState<SyncErrorCode | null>(null);

  const code = cleanKey(value);
  const problem = isValidKey(code) ? null : codeProblem(code) ?? "few-words";

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (problem) return;
    const result = await onChange(code);
    if (result.ok) onDone();
    else setError(result.error);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{t("change.title")}</DialogTitle>
        <DialogDescription>{t("change.description")}</DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <Label htmlFor={id}>{t("change.label")}</Label>
        <div className="flex gap-2">
          <Input
            id={id}
            dir="ltr"
            value={value}
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            aria-invalid={problem !== null || error !== null}
            aria-describedby={`${id}-help`}
            onChange={(event) => {
              setValue(event.target.value);
              setError(null);
            }}
            className="font-mono"
          />
          <Button type="button" variant="outline" size="icon" aria-label={t("change.suggest")} title={t("change.suggest")} onClick={() => setValue(formatKey(generateKey()))}>
            <ShuffleIcon />
          </Button>
        </div>
        <p id={`${id}-help`} role={problem || error ? "alert" : undefined} className={problem || error ? "text-sm text-destructive" : "text-sm text-muted-foreground"}>
          {error ? t(`errors.${error}`) : problem ? t(`change.problems.${problem}`) : t("change.own")}
        </p>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("cancel")}
        </Button>
        <Button type="submit" disabled={busy || problem !== null}>
          {busy ? t("change.working") : t("change.confirm")}
        </Button>
      </DialogFooter>
    </form>
  );
}
