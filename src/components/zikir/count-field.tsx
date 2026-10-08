import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MAX_COUNT } from "@/lib/zikir/validate";

type Props = { id: string; label: string; value: string; onChange: (value: string) => void; error?: string; className?: string };

export function CountField({ id, label, value, onChange, error, className }: Props) {
  return (
    <div className={className ?? "flex flex-col gap-2"}>
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="number"
        inputMode="numeric"
        min={1}
        max={MAX_COUNT}
        step={1}
        value={value}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        onChange={(event) => onChange(event.target.value)}
      />
      {error && (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
