"use client";

import { useId, useState, type FormEvent } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NOTE_LIMIT, useBookmarkStore } from "@/stores/bookmark-store";

type Target = { surah: number; ayah: number; title: string };

export function NoteDialog({ target, onClose }: { target: Target | null; onClose: () => void }) {
  const t = useTranslations("bookmarks");
  return (
    <Dialog open={target !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>{target && <NoteForm key={`${target.surah}:${target.ayah}`} target={target} onDone={onClose} title={t("noteTitle", { place: target.title })} />}</DialogContent>
    </Dialog>
  );
}

function NoteForm({ target, onDone, title }: { target: Target; onDone: () => void; title: string }) {
  const t = useTranslations("bookmarks");
  const id = useId();
  const saved = useBookmarkStore((s) => s.bookmarks[`${target.surah}:${target.ayah}`]);
  const [note, setNote] = useState(saved?.deletedAt === null ? saved.note : "");

  const submit = (event: FormEvent) => {
    event.preventDefault();
    useBookmarkStore.getState().setNote(target.surah, target.ayah, note);
    onDone();
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{t("noteDescription")}</DialogDescription>
      </DialogHeader>
      <div className="flex flex-col gap-2">
        <Label htmlFor={id}>{t("noteLabel")}</Label>
        <Textarea id={id} value={note} maxLength={NOTE_LIMIT} rows={5} onChange={(event) => setNote(event.target.value)} />
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone}>
          {t("cancel")}
        </Button>
        <Button type="submit">{t("save")}</Button>
      </DialogFooter>
    </form>
  );
}
