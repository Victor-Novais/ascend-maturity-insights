import { cn } from "@/lib/utils";

export function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg bg-muted animate-shimmer bg-[length:200%_100%] bg-gradient-to-r from-muted via-muted-foreground/5 to-muted",
        className
      )}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="ascend-card space-y-4 animate-fade-in">
      <SkeletonBlock className="h-5 w-2/3" />
      <SkeletonBlock className="h-4 w-full" />
      <SkeletonBlock className="h-4 w-4/5" />
      <div className="flex gap-3 pt-2">
        <SkeletonBlock className="h-9 w-24" />
        <SkeletonBlock className="h-9 w-20" />
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3 animate-fade-in">
      <SkeletonBlock className="h-10 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonBlock key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}
