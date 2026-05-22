"use client";

import { useEffect, useState } from "react";
import { getLayoutsByLot } from "@/services/layoutService";
import { useRouter } from "next/navigation";
import { Button } from "../ui/button";
import { Skeleton } from "../Skeleton";

interface Layout {
  layoutId: string;
  layoutName: string;
  totalRows: number;
  totalColumns: number;
  notes?: string;
  createdAt: number;
  updatedAt?: number;
  lotId?: string;
}

interface Props {
  readonly lotId?: string;
  readonly onRefresh?: () => void;
}

export default function LayoutList({ lotId = "default-lot-id", onRefresh }: Props) {
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const router = useRouter();

  const fetchLayouts = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const data = await getLayoutsByLot(lotId);
      setLayouts(data);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (err) {
      console.error("Error fetching layouts:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch layouts");
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLayouts();
    const interval = setInterval(() => fetchLayouts(false), 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lotId]);

  const handleEdit = (layoutId: string) => {
    router.push(`/dashboard/editlayout?id=${layoutId}`);
  };

  const handleDelete = async (layoutId: string) => {
    if (!confirm("Are you sure you want to delete this layout?")) return;

    try {
      const { deleteLayout } = await import("@/services/layoutService");
      await deleteLayout(layoutId);
      fetchLayouts(); // Refresh the list
      onRefresh?.();
    } catch (err) {
      console.error("Error deleting layout:", err);
      alert("Failed to delete layout");
    }
  };

  const getTruncatedNotes = (notes: string | undefined): string => {
    if (!notes) return "-";
    return notes.length > 30 ? notes.substring(0, 30) + "..." : notes;
  };

  return (
    <div className="max-h-[770px] overflow-y-auto rounded dark:text-slate-100">
      <div className="flex items-center justify-between gap-2 border-b 
      bg-gray-100 px-3 py-2 text-sm 
      dark:bg-gray-900">
        <span className="font-semibold">Layouts</span>
        <span className="text-slate-500 dark:text-slate-400">
          {error ? (
            <span className="text-red-600 dark:text-red-400">{error}</span>
          ) : (
            `Last updated ${lastUpdated || "—"}`
          )}
        </span>
      </div>

      <div className="grid grid-cols-5 border-b 
      bg-gray-100 
      dark:bg-gray-900">
        <div className="p-3 font-semibold">Name</div>
        <div className="p-3 text-center font-semibold">Size</div>
        <div className="p-3 text-center font-semibold">Notes</div>
        <div className="p-3 text-center font-semibold">Created</div>
        <div className="p-3 text-center font-semibold">Actions</div>
      </div>

      {loading && (
        <div aria-busy="true" aria-live="polite">
          <span className="sr-only">Loading layouts…</span>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="grid grid-cols-5 border-b">
              <div className="p-3"><Skeleton className="h-5 w-24" /></div>
              <div className="p-3 flex justify-center"><Skeleton className="h-5 w-16" /></div>
              <div className="p-3 flex justify-center"><Skeleton className="h-5 w-20" /></div>
              <div className="p-3 flex justify-center"><Skeleton className="h-5 w-20" /></div>
              <div className="p-3 flex justify-center gap-2">
                <Skeleton className="h-9 w-16" />
                <Skeleton className="h-9 w-16" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && layouts.length === 0 && (
        <div className="p-4 text-center text-slate-500 dark:text-slate-400">No layouts found</div>
      )}

      {!loading && layouts.length > 0 &&
        layouts.map((layout) => (
          <div key={layout.layoutId} className="grid grid-cols-5 border-b 
          hover:bg-gray-100 
          dark:hover:bg-gray-900">
            <div className="p-3">{layout.layoutName}</div>
            <div className="p-3 text-center text-sm">
              {layout.totalRows} × {layout.totalColumns}
            </div>
            <div className="p-3 text-center text-sm text-slate-600 dark:text-slate-400">
              {getTruncatedNotes(layout.notes)}
            </div>
            <div className="p-3 text-center text-sm">
              {new Date(layout.createdAt).toLocaleDateString()}
            </div>
            <div className="p-3 flex justify-center gap-2">
              <Button
                onClick={() => handleEdit(layout.layoutId)}
                className="shadow-md active:shadow-inner active:translate-y-px grow bg-black text-white hover:bg-white hover:text-black hover:border-black border border-transparent dark:bg-white dark:text-black dark:hover:bg-slate-800 dark:hover:text-white dark:hover:border-white"
              >
                Edit
              </Button>
              <Button
                onClick={() => handleDelete(layout.layoutId)}
                className="shadow-md active:shadow-inner active:translate-y-px grow bg-red-600 text-white hover:bg-white hover:text-red-600 hover:border-red-600 border border-transparent dark:bg-red-700 dark:hover:bg-slate-800 dark:hover:text-white dark:hover:border-white"
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
    </div>
  );
}
