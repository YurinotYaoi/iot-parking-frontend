"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/configs/firebaseClient";
import { Button } from "@/components/ui/button";
import EditSpotModal from "@/components/modals/EditSpotModal";

type SensorInfo = {
  sensorId: string;
  deviceId: string;
  status?: string;
  assigned?: boolean;
};

type LayoutInfo = {
  layoutName: string;
  gridRow: number | null;
  gridCol: number | null;
};

type SpotRow = {
  slotId: string;
  slotName: string;
  rowNo: string;
  columnNo: string;
  floor: string;
  vehicleType?: string;
  status: string;
  ownerId?: string;
  layoutId?: string;
  lotId?: string;
  sensor?: SensorInfo | null;
  layoutInfo?: LayoutInfo | null;
};

export default function SensorList() {
  const [spots, setSpots] = useState<SpotRow[]>([]);
  const [selectedSpot, setSelectedSpot] = useState<SpotRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchSpots = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) {
        if (showLoading) setLoading(false);
        return;
      }

      const token = await user.getIdToken();
      const res = await fetch("/api/spots", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const response = await res.json();
      setSpots(response.data || []);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error("Error fetching spots:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    fetchSpots();
    const interval = setInterval(() => fetchSpots(false), 5000);
    return () => clearInterval(interval);
  }, []);

  const closeModal = () => setSelectedSpot(null);
  const handleRefresh = () => {
    closeModal();
    fetchSpots();
  };

  return (
    <div className="max-h-[770px] overflow-y-auto rounded dark:text-slate-100">
      <EditSpotModal spot={selectedSpot} onClose={closeModal} onSaved={handleRefresh} />

      <div className="flex items-center justify-between gap-2 border-b 
      bg-gray-100 px-3 py-2 text-sm 
      dark:bg-gray-900">
        <span className="font-semibold">Parking slots</span>
        <span className="text-slate-500 dark:text-slate-400">Auto-refresh every 5s · last updated {lastUpdated || "—"}</span>
      </div>

      <div className="grid grid-cols-7 border-b 
      bg-gray-100 
      dark:bg-gray-900">
        <div className="p-3 font-semibold">Slot Name</div>
        <div className="p-3 text-center font-semibold">Layout Name</div>
        <div className="p-3 text-center font-semibold">Grid Column</div>
        <div className="p-3 text-center font-semibold">Grid Row</div>
        <div className="p-3 text-center font-semibold">Status</div>
        <div className="p-3 text-center font-semibold">Sensor</div>
        <div className="p-3 text-center font-semibold">Action</div>
      </div>

      {loading && (
        <div className="col-span-7 p-4 text-center">Loading slots...</div>
      )}
      {!loading && spots.length === 0 && (
        <div className="p-4 text-center">No slots found.</div>
      )}
      {!loading && spots.length > 0 &&
        spots.map((spot) => {
          const displayStatus = spot.sensor?.status || spot.status;
          let statusDisplay = "🟢 Available";
          if (displayStatus === "occupied" || displayStatus === "offline") {
            statusDisplay = "🔴 " + (displayStatus === "occupied" ? "Occupied" : "Offline");
          } else if (displayStatus === "online") {
            statusDisplay = "🟡 Online";
          }

          return (
            <div key={spot.slotId} className="grid grid-cols-7 border-b 
            hover:bg-gray-100 
            dark:hover:bg-gray-900">
              <div className="p-3">{spot.slotName}</div>
              <div className="p-3 text-center">{spot.layoutInfo?.layoutName || "-"}</div>
              <div className="p-3 text-center">{spot.layoutInfo?.gridCol || "-"}</div>
              <div className="p-3 text-center">{spot.layoutInfo?.gridRow || "-"}</div>
              <div className="p-3 text-center">{statusDisplay}</div>
              <div className="p-3 text-center">{spot.sensor?.sensorId || "None"}</div>
              <div className="p-3 flex justify-center">
                <Button className="shadow-md active:shadow-inner active:translate-y-px w-full bg-black text-white hover:bg-white hover:text-black hover:border-black border border-transparent dark:bg-white dark:text-black dark:hover:bg-slate-800 dark:hover:text-white dark:hover:border-white" onClick={() => setSelectedSpot(spot)}>
                  Edit
                </Button>
              </div>
            </div>
          );
        })}
    </div>
  );
}