"use client";

import { CheckIcon, ChevronDownIcon, SearchIcon } from "lucide-react";
import { Popover } from "radix-ui";
import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type PickerItem = { id: number; label: string; trailing?: string };

export type PickerLabels = {
  /** Shown on the button while nothing is chosen. */
  empty: string;
  /** Read out before the chosen value, so the button says what it chooses. */
  prefix: string;
  search: string;
  placeholder: string;
  list: string;
  noResults: (query: string) => string;
};

/**
 * The list floats over the widget like a tooltip, so opening it never changes the widget's size.
 * It is created inside the widget's own wrapper, so it keeps the widget's colours, and it flips or
 * shrinks to stay inside a host's small frame. The "pill" look sits beside other things in a row.
 */
export function SearchPicker({
  items,
  value,
  onSelect,
  matches,
  labels,
  variant = "field",
  id: triggerId,
}: {
  items: PickerItem[];
  value: number | null;
  onSelect: (id: number) => void;
  matches: (id: number, query: string) => boolean;
  labels: PickerLabels;
  variant?: "field" | "pill";
  id?: string;
}) {
  const id = useId();
  const [container, setContainer] = useState<HTMLElement | null>(null);
  const list = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const shown = useMemo(() => items.filter((item) => matches(item.id, query)), [items, matches, query]);
  const current = items.find((item) => item.id === value);
  const activeItem = shown[active];
  const pill = variant === "pill";

  useEffect(() => {
    if (open) list.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: "nearest" });
  }, [open, active, shown]);

  const onOpenChange = (next: boolean) => {
    if (next) setActive(Math.max(0, items.findIndex((item) => item.id === value)));
    else setQuery("");
    setOpen(next);
  };

  const choose = (chosen: number) => {
    onSelect(chosen);
    onOpenChange(false);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") setActive(Math.min(active + 1, shown.length - 1));
    else if (event.key === "ArrowUp") setActive(Math.max(active - 1, 0));
    else if (event.key === "Home") setActive(0);
    else if (event.key === "End") setActive(Math.max(shown.length - 1, 0));
    else if (event.key === "Enter" && activeItem) choose(activeItem.id);
    else return;
    event.preventDefault();
  };

  return (
    <div ref={setContainer} className={pill ? "contents" : "block"}>
      <Popover.Root open={open} onOpenChange={onOpenChange}>
        <Popover.Trigger asChild>
          <button
            id={triggerId}
            type="button"
            aria-haspopup="listbox"
            className={cn(
              "flex items-center justify-between gap-2 border border-input text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
              pill ? "h-9 min-w-0 max-w-64 rounded-full bg-card px-3 shadow-sm" : "h-10 w-full rounded-lg bg-background px-2.5",
            )}
          >
            {current ? (
              <span className="flex min-w-0 items-center gap-2">
                <span className="sr-only">{labels.prefix}: </span>
                <span className="truncate">{current.label}</span>
                {current.trailing && (
                  <span lang="ar" dir="rtl" className="shrink-0 font-arabic text-base text-muted-foreground">
                    {current.trailing}
                  </span>
                )}
              </span>
            ) : (
              <span className="truncate text-muted-foreground">{labels.empty}</span>
            )}
            <ChevronDownIcon aria-hidden className={cn("size-4 shrink-0 transition-transform", open && "rotate-180")} />
          </button>
        </Popover.Trigger>

        <Popover.Portal container={container}>
          <Popover.Content
            side="bottom"
            align={pill ? "end" : "start"}
            sideOffset={6}
            collisionPadding={8}
            aria-label={labels.list}
            className={cn(
              "z-50 flex max-h-(--radix-popover-content-available-height) max-w-(--radix-popover-content-available-width) flex-col gap-2 overflow-hidden rounded-lg border bg-popover p-2 text-popover-foreground shadow-md",
              pill ? "w-72" : "w-(--radix-popover-trigger-width) min-w-48",
            )}
          >
            <div className="relative shrink-0">
              <SearchIcon aria-hidden className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                role="combobox"
                aria-expanded
                aria-controls={`${id}-list`}
                aria-autocomplete="list"
                aria-activedescendant={activeItem ? `${id}-option-${activeItem.id}` : undefined}
                aria-label={labels.search}
                type="text"
                autoComplete="off"
                spellCheck={false}
                value={query}
                placeholder={labels.placeholder}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActive(0);
                }}
                onKeyDown={onKeyDown}
                className="h-9 pl-8"
              />
            </div>
            {shown.length === 0 && (
              <p role="status" className="flex h-56 min-h-0 shrink items-center justify-center px-3 text-center text-sm text-muted-foreground">
                {labels.noResults(query)}
              </p>
            )}
            <ul ref={list} id={`${id}-list`} role="listbox" aria-label={labels.list} hidden={shown.length === 0} className="h-56 min-h-0 shrink overflow-y-auto overscroll-contain">
              {shown.map((item, index) => {
                const selected = item.id === value;
                return (
                  <li
                    key={item.id}
                    id={`${id}-option-${item.id}`}
                    role="option"
                    aria-selected={selected}
                    data-active={index === active}
                    onClick={() => choose(item.id)}
                    onMouseMove={() => active !== index && setActive(index)}
                    className={cn(
                      "flex h-10 cursor-pointer items-center justify-between gap-3 rounded-md px-2 text-sm",
                      index === active && "bg-muted",
                      selected && "font-semibold text-primary",
                    )}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      {selected ? <CheckIcon aria-hidden className="size-4 shrink-0" /> : <span aria-hidden className="size-4 shrink-0" />}
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.trailing && (
                      <span lang="ar" dir="rtl" className="shrink-0 font-arabic text-base">
                        {item.trailing}
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}
