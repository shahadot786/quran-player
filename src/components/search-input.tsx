"use client";

import { SearchIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function SearchInput({
  value,
  onChange,
  placeholder,
  label,
  clearLabel,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
  clearLabel: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <SearchIcon aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className="h-10 pr-10 pl-9 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <Button variant="ghost" size="icon-sm" onClick={() => onChange("")} aria-label={clearLabel} className="absolute top-1/2 right-1.5 -translate-y-1/2">
          <XIcon />
        </Button>
      )}
    </div>
  );
}
