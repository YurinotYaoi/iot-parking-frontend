import { cn } from "@/lib/utils"; // optional helper, see note below
 
type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;
 
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      // role + aria-hidden because the surrounding container should announce
      // the loading state (see loading.tsx). The shapes themselves are decorative.
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-md bg-zinc-200/80 dark:bg-zinc-800",
        className
      )}
      {...props}
    />
  );
}