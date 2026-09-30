"use client";

import { useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PlaylistDialog({
  open,
  onOpenChange,
  mode,
  initialName = "",
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "rename";
  initialName?: string;
  onSubmit: (name: string) => void;
}) {
  const t = useTranslations("playlists");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader className="sr-only">
          <DialogDescription>{t("name")}</DialogDescription>
        </DialogHeader>
        {open && <PlaylistForm key={initialName} mode={mode} initialName={initialName} onSubmit={onSubmit} onCancel={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function PlaylistForm({
  mode,
  initialName,
  onSubmit,
  onCancel,
}: {
  mode: "create" | "rename";
  initialName: string;
  onSubmit: (name: string) => void;
  onCancel: () => void;
}) {
  const t = useTranslations("playlists");
  const [name, setName] = useState(initialName);
  const [error, setError] = useState(false);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) {
      setError(true);
      return;
    }
    onSubmit(name.trim());
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
      <DialogTitle>{mode === "create" ? t("createTitle") : t("renameTitle")}</DialogTitle>
      <div className="flex flex-col gap-2">
        <Label htmlFor="playlist-name">{t("name")}</Label>
        <Input
          id="playlist-name"
          autoFocus
          value={name}
          maxLength={60}
          placeholder={t("namePlaceholder")}
          aria-invalid={error || undefined}
          aria-describedby={error ? "playlist-name-error" : undefined}
          onChange={(event) => {
            setName(event.target.value);
            setError(false);
          }}
        />
        {error && (
          <p id="playlist-name-error" className="text-sm text-destructive">
            {t("nameRequired")}
          </p>
        )}
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          {t("cancel")}
        </Button>
        <Button type="submit">{mode === "create" ? t("createAction") : t("save")}</Button>
      </DialogFooter>
    </form>
  );
}
