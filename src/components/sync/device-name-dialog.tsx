"use client";

import { useId, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cleanDeviceName, DEVICE_NAME_LIMIT } from "@/lib/sync/device-label";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The name shown now. */
  current: string;
  /** The name made from the browser, used when the field is left empty. */
  automatic: string;
  onSave: (name: string | null) => void;
};

export function DeviceNameDialog({ open, onOpenChange, current, automatic, onSave }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>{open && <NameForm current={current} automatic={automatic} onSave={onSave} onCancel={() => onOpenChange(false)} />}</DialogContent>
    </Dialog>
  );
}

function NameForm({ current, automatic, onSave, onCancel }: Pick<Props, "current" | "automatic" | "onSave"> & { onCancel: () => void }) {
  const t = useTranslations("sync.devices");
  const tSync = useTranslations("sync");
  const id = useId();
  const [value, setValue] = useState(current === automatic ? "" : current);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const name = cleanDeviceName(value);
    onSave(name === "" || name === automatic ? null : name);
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{t("renameTitle")}</DialogTitle>
        <DialogDescription>{t("renameDescription", { label: automatic })}</DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <Label htmlFor={id}>{t("renameLabel")}</Label>
        <Input id={id} value={value} maxLength={DEVICE_NAME_LIMIT} placeholder={automatic} autoComplete="off" onChange={(event) => setValue(event.target.value)} />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          {tSync("cancel")}
        </Button>
        <Button type="submit">{t("renameSave")}</Button>
      </DialogFooter>
    </form>
  );
}
