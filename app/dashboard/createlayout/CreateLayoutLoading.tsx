
import { Skeleton } from "@/components/Skeleton";

export default function CreateLayoutLoading() {
  return (
    <main
      className="flex flex-col w-full items-center justify-center"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading create layout…</span>
      <div className="w-screen max-w-600 flex-rows h-213">
        <div className="p-2 flex flex-col gap-6 dark:text-slate-100 dark:bg-slate-950 h-213">

          {/* Header skeleton */}
          <div className="w-full flex border-2 border-gray-800 rounded-md p-1 justify-between items-center">
            <Skeleton className="h-7 w-36 ml-2" />
            <div className="flex gap-1">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-9 w-28" />
            </div>
          </div>

          <div className="flex gap-6 flex-1 overflow-hidden">

            {/* LEFT skeleton — toolbar + grid */}
            <div className="flex-1 flex flex-col gap-4 overflow-hidden border-2 border-gray-800 rounded-md p-2">
              <Skeleton className="h-10 w-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
              {/* Faux grid — matches 5 rows × 8 cols default */}
              <div className="grid grid-cols-8 gap-1">
                {Array.from({ length: 40 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-square w-full" />
                ))}
              </div>
              <Skeleton className="h-4 w-1/2" />
            </div>

            {/* RIGHT skeleton — control panel */}
            <div className="w-80 flex flex-col gap-6">

              {/* Box 1 — Layout Info */}
              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-slate-900 dark:border-slate-700 space-y-4">
                <Skeleton className="h-5 w-24" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-9 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </div>

              {/* Box 2 — Grid Configuration */}
              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-slate-900 dark:border-slate-700 space-y-4">
                <Skeleton className="h-5 w-40" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-9 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-9 w-full" />
                </div>
              </div>

              {/* Box 3 — Available Spots */}
              <div className="border rounded-lg p-4 bg-gray-50 dark:bg-slate-900 dark:border-slate-700 flex-1 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <div className="border rounded bg-white dark:bg-slate-800 dark:border-slate-700">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-3 border-b dark:border-slate-700">
                      <Skeleton className="h-4 w-24 mb-1" />
                      <Skeleton className="h-3 w-40 mb-1" />
                      <Skeleton className="h-4 w-16" />
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
