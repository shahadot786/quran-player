import type { ReactNode } from "react";

export function StatusMessage({ title, description, children }: { title: string; description: string; children?: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-16 text-center">
      <h1 className="text-3xl font-semibold tracking-tight text-balance">{title}</h1>
      <p className="text-muted-foreground text-pretty">{description}</p>
      {children}
    </div>
  );
}
