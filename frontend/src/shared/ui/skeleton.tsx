import { cn } from "@/shared/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl bg-white/8 [data-theme=light_&]:bg-black/6",
        className
      )}
    />
  );
}

export function RoadmapCardSkeleton() {
  return (
    <div className="glass-surface flex min-w-0 flex-col gap-4 rounded-[1.75rem] p-5 sm:rounded-3xl">
      <div className="flex items-start justify-between gap-3">
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
      <div className="space-y-2">
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
      <div className="mt-auto pt-2">
        <Skeleton className="h-4 w-1/3" />
      </div>
      <Skeleton className="h-9 w-28" />
    </div>
  );
}
