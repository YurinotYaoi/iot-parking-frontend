"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/configs/firebaseClient";
import { SpotData } from "@/models/layout";

interface SpotWithLayoutInfo extends SpotData {
  layoutInfo?: {
    layoutName?: string;
  };
}

interface Props {
  readonly placedSpotIds: string[];
  readonly onSelectSpot: (spot: SpotWithLayoutInfo) => void;
  readonly currentLayoutId?: string | null;
}

export default function AvailableSpots({ placedSpotIds, onSelectSpot, currentLayoutId }: Props) {
  const [spots, setSpots] = useState<SpotWithLayoutInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSpots = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = auth.currentUser;
      if (!user) {
        setError("Not authenticated");
        setLoading(false);
        return;
      }

      const token = await user.getIdToken();
      const res = await fetch("/api/spots", {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!res.ok) {
        throw new Error("Failed to fetch spots");
      }
      
      const response = await res.json();
      setSpots(response.data || []);
    } catch (err) {
      console.error("Error fetching spots:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch spots");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpots();
  }, []);

  const availableSpots = spots.filter(
    (spot) =>
      !placedSpotIds.includes(spot.slotId) &&
      (!spot.layoutId || spot.layoutId === currentLayoutId)
  );

  const usedSpots = spots.filter(
    (spot) => spot.layoutId && spot.layoutId !== currentLayoutId
  );

  return (
    <div className="flex flex-col gap-3 dark:text-slate-100">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold dark:text-slate-100">Available Spots</h3>
        <button
          onClick={fetchSpots}
          disabled={loading}
          className="text-xs px-2 py-1 border rounded hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50 dark:text-slate-300 dark:border-slate-600"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && <div className="text-red-600 dark:text-red-400 text-sm">{error}</div>}

      <div className="max-h-43 overflow-y-auto border rounded bg-white dark:bg-slate-800 dark:border-slate-700">
        {loading && (
          <div className="p-4 text-center text-gray-500 dark:text-slate-400">Loading spots...</div>
        )}

        {!loading && availableSpots.length === 0 && (
          <div className="p-4 text-center text-gray-500 dark:text-slate-400">
            {spots.length === 0 ? "No spots available" : "All spots placed or all remaining spots are assigned"}
          </div>
        )}

        {!loading &&
          availableSpots.map((spot) => {
            const getStatusClass = () => {
              if (spot.status === "available") return "bg-green-600";
              if (spot.status === "occupied") return "bg-red-600";
              return "bg-gray-600";
            };

            return (
              <button
                key={spot.slotId}
                onClick={() => onSelectSpot(spot)}
                className="w-full text-left p-3 border-b cursor-pointer hover:bg-blue-50 transition-colors"
              >
                <div className="font-semibold text-sm">{spot.slotName}</div>
                <div className="text-xs text-gray-600 dark:text-slate-400">
                  Floor: {spot.floor} | Row: {spot.rowNo} | Col: {spot.columnNo}
                </div>
                <div className="text-xs mt-1">
                  <span
                    className={`inline-block px-2 py-0.5 rounded text-white ${getStatusClass()}`}
                  >
                    {spot.status}
                  </span>
                </div>
              </button>
            );
          })}

        {usedSpots.length > 0 && (
          <div className="p-3 text-xs text-gray-500 dark:text-slate-400 border-t dark:border-slate-700">
            These spots are already assigned to another layout.
          </div>
        )}

        {!loading &&
          usedSpots.map((spot) => {
            return (
              <div
                key={spot.slotId}
                className="w-full text-left p-3 border-b bg-gray-100 dark:bg-slate-700 opacity-70 dark:text-slate-300 dark:border-slate-700"
              >
                <div className="font-semibold text-sm">{spot.slotName}</div>
                <div className="text-xs text-gray-600 dark:text-slate-400">
                  Used on {spot.layoutInfo?.layoutName || spot.layoutId}
                </div>
                <div className="text-xs mt-1 text-gray-500 dark:text-slate-400">
                  {spot.status}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
