"use client";

import { useId, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SyncErrorCode } from "@/lib/sync/client";
import type { SyncResult } from "./use-sync";

export function RestoreDialog({
  open,
  onOpenChange,
  onRestore,
  busy,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRestore: (key: string) => Promise<SyncResult>;
  busy: boolean;
}) {
  const t = useTranslations("sync");
  const id = useId();
  const [value, setValue] = useState("");
  const [error, setError] = useState<SyncErrorCode | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const result = await onRestore(value);
    if (result.ok) {
      setValue("");
      setError(null);
      onOpenChange(false);
    } else {
      setError(result.error);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setError(null);
        onOpenChange(next);
      }}
    >
      <DialogContent>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{t("restore.title")}</DialogTitle>
            <DialogDescription>{t("restore.description")}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2">
            <Label htmlFor={id}>{t("restore.label")}</Label>
            <Input
              id={id}
              dir="ltr"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-invalid={error !== null}
              aria-describedby={error ? `${id}-error` : undefined}
              className="font-mono"
            />
            {error && (
              <p id={`${id}-error`} role="alert" className="text-sm text-destructive">
                {t(`errors.${error}`)}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={busy || value.trim() === ""}>
              {busy ? t("restore.restoring") : t("restore.confirm")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
