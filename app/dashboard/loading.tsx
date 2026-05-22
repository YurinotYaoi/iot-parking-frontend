
import { Skeleton } from "@/components/Skeleton";

export default function DashboardLoading() {
  return (
    <main
      className="flex flex-col w-full items-center justify-center"
      aria-busy="true"
      aria-live="polite"
    >
      <span className="sr-only">Loading dashboard…</span>
      <div className="w-screen max-w-600 flex flex-rows h-213">

        {/* LEFT PANEL */}
        <div className="w-[30%] p-2">
          <div className="h-full w-full border-2 border-gray-800 rounded-md p-1">
            {/* User name */}
            <div className="p-10 flex justify-center">
              <Skeleton className="h-9 w-48" />
            </div>

            <div className="text-2xl">
              {/* Location button */}
              <Skeleton className="h-10 w-full" />

              {/* Map area */}
              <div className="mt-4">
                <Skeleton className="h-[600px] w-full rounded-md" />
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-[70%] p-2 flex flex-col">
          {/* Button bar */}
          <div className="h-fit w-full flex border-2 border-gray-800 rounded-md p-1 mb-1 justify-between">
            <div className="flex gap-1">
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-9 w-24" />
            </div>
            <div className="flex gap-1">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
          </div>

          {/* Sensor table */}
          <div className="grow w-full border-2 border-gray-800 rounded-md overflow-hidden">
            {/* Top bar */}
            <div className="flex items-center justify-between gap-2 border-b bg-gray-100 px-3 py-2 dark:bg-gray-900">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-48" />
            </div>

            {/* Column headers */}
            <div className="grid grid-cols-7 border-b bg-gray-100 dark:bg-gray-900">
              <div className="p-3"><Skeleton className="h-4 w-16" /></div>
              <div className="p-3 flex justify-center"><Skeleton className="h-4 w-24" /></div>
              <div className="p-3 flex justify-center"><Skeleton className="h-4 w-20" /></div>
              <div className="p-3 flex justify-center"><Skeleton className="h-4 w-16" /></div>
              <div className="p-3 flex justify-center"><Skeleton className="h-4 w-14" /></div>
              <div className="p-3 flex justify-center"><Skeleton className="h-4 w-14" /></div>
              <div className="p-3 flex justify-center"><Skeleton className="h-4 w-14" /></div>
            </div>

            {/* Data rows */}
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="grid grid-cols-7 border-b">
                <div className="p-3"><Skeleton className="h-5 w-20" /></div>
                <div className="p-3 flex justify-center"><Skeleton className="h-5 w-24" /></div>
                <div className="p-3 flex justify-center"><Skeleton className="h-5 w-8" /></div>
                <div className="p-3 flex justify-center"><Skeleton className="h-5 w-8" /></div>
                <div className="p-3 flex justify-center"><Skeleton className="h-5 w-16" /></div>
                <div className="p-3 flex justify-center"><Skeleton className="h-5 w-20" /></div>
                <div className="p-3 flex justify-center"><Skeleton className="h-8 w-full" /></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
