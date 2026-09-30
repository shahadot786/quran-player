import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="flex flex-col gap-6">
      <Skeleton className="h-9 w-48" />
      <Skeleton className="h-10 w-full max-w-md" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 12 }, (_, i) => (
          <Skeleton key={i} className="h-18 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
