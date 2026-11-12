"use client";

import { XIcon } from "lucide-react";
import { useId } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { normalizeHex } from "@/lib/embed/options";

export function ColorField({
  label,
  value,
  onChange,
  invalidText,
  pickLabel,
  clearLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  invalidText: string;
  pickLabel: string;
  clearLabel: string;
}) {
  const id = useId();
  const valid = normalizeHex(value);
  const invalid = value.trim() !== "" && !valid;

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          aria-label={pickLabel}
          value={valid ? valid.slice(0, 7) : "#13756a"}
          onChange={(event) => onChange(event.target.value)}
          className="size-9 shrink-0 cursor-pointer rounded-lg border bg-card p-0.5"
        />
        <Input id={id} value={value} onChange={(event) => onChange(event.target.value)} placeholder="#13756a" maxLength={9} spellCheck={false} aria-invalid={invalid} aria-describedby={invalid ? `${id}-error` : undefined} className="h-9 font-mono" />
        {value && (
          <Button type="button" variant="ghost" size="icon" aria-label={clearLabel} onClick={() => onChange("")}>
            <XIcon aria-hidden />
          </Button>
        )}
      </div>
      {invalid && (
        <p id={`${id}-error`} className="text-xs text-destructive">
          {invalidText}
        </p>
      )}
    </div>
  );
}
