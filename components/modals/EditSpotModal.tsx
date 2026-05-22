"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/configs/firebaseClient";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type SensorInfo = {
  sensorId: string;
  deviceId: string;
  status?: string;
  assigned?: boolean;
};

type LayoutInfo = {
  layoutName?: string;
  gridRow?: number | null;
  gridCol?: number | null;
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

type Props = {
  spot: SpotRow | null;
  onClose: () => void;
  onSaved: () => void;
};

const EditSpotModal = ({ spot, onClose, onSaved }: Props) => {
  const [slotName, setSlotName] = useState("");
  const [vehicleType, setVehicleType] = useState("any");
  const [rowNo, setRowNo] = useState("");
  const [columnNo, setColumnNo] = useState("");
  const [floor, setFloor] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!spot) return;
    setSlotName(spot.slotName || "");
    setVehicleType(spot.vehicleType || "any");
    setRowNo(spot.rowNo || "");
    setColumnNo(spot.columnNo || "");
    setFloor(spot.floor || "");
  }, [spot]);

  if (!spot) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not logged in");
      const token = await user.getIdToken();

      const res = await fetch(`/api/spots/${spot.slotId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          slotName,
          vehicleType,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Failed to save slot");

      toast.success("Slot saved successfully!");
      onSaved();
    } catch (error: any) {
      toast.error(error.message || "Unable to save slot");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not logged in");
      const token = await user.getIdToken();

      if (spot.sensor?.sensorId) {
        const sensorRes = await fetch(`/api/sensors/${spot.sensor.sensorId}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            spotId: "",
            assigned: false,
          }),
        });
        const sensorData = await sensorRes.json();
        if (!sensorRes.ok) throw new Error(sensorData.error || sensorData.message || "Failed to unassign sensor");
      }

      const deleteRes = await fetch(`/api/spots/${spot.slotId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const deleteData = await deleteRes.json();
      if (!deleteRes.ok) throw new Error(deleteData.error || deleteData.message || "Failed to delete spot");

      toast.success("Slot deleted successfully!");
      onSaved();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Unable to delete spot");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close edit slot dialog"
      />

      <div className="relative bg-white p-6 rounded-xl shadow-xl dark:bg-slate-900 dark:text-slate-100" style={{ width: 420 }}>
        <h2 className="text-xl font-semibold mb-4">Edit Slot</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="slot-name" className="block text-sm font-medium text-slate-900 dark:text-slate-100">
              Slot Name
            </label>
            <input
              id="slot-name"
              className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              value={slotName}
              onChange={(e) => setSlotName(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="vehicle-type" className="block text-sm font-medium text-slate-900 dark:text-slate-100">
              Vehicle Type
            </label>
            <input
              id="vehicle-type"
              className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3 text-sm text-slate-700 dark:text-slate-300">
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
              <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Floor</div>
              <div className="mt-1 text-base text-slate-900 dark:text-slate-100">{floor || "—"}</div>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
              <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Row</div>
              <div className="mt-1 text-base text-slate-900 dark:text-slate-100">{rowNo || "—"}</div>
            </div>
            <div className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800">
              <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Column</div>
              <div className="mt-1 text-base text-slate-900 dark:text-slate-100">{columnNo || "—"}</div>
            </div>
          </div>

          <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
            <p>Device Id: {spot.sensor?.deviceId || "None"}</p>
            <p>Owner: {spot.ownerId || "—"}</p>
            <p>Layout: {spot.layoutInfo?.layoutName || spot.layoutId || "—"}</p>
            <p>Grid Row: {(spot.layoutInfo?.gridRow ?? spot.rowNo) || "—"}</p>
            <p>Grid Col: {(spot.layoutInfo?.gridCol ?? spot.columnNo) || "—"}</p>
            <p>Lot ID: {spot.lotId || "—"}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <Button className="shadow-md active:shadow-inner active:translate-y-px w-full bg-black text-white hover:bg-white hover:text-black hover:border-black border border-transparent dark:bg-white dark:text-black dark:hover:bg-slate-800 dark:hover:text-white dark:hover:border-slate-800 " onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </Button>

          <Button
            variant="destructive"
            className="w-full"
            onClick={handleDelete}
            disabled={deleting || saving}
          >
            {deleting ? "Deleting..." : "Delete slot"}
          </Button>

          <Button variant="outline" className="w-full" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EditSpotModal;
