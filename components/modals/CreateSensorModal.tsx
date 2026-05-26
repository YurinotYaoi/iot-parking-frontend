"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/configs/firebaseClient";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Spinner } from "@/components/Spinner";

type Props = {
  onClose: () => void;
};

type Sensor = {
  sensorId: string;
  deviceId: string;
  name: string;
  spotId?: string;
};

type FormErrors = {
  slotName?: string;
  vehicleType?: string;
  selectedSensor?: string;
  form?: string;
};

export default function CreateSensorModal({ onClose }: Props) {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [slotName, setSlotName] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [selectedSensor, setSelectedSensor] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const clearFieldError = (field: keyof FormErrors) =>
    setErrors((prev) => ({ ...prev, [field]: undefined }));

  // Grid values will be assigned later by layout management
  const rowNo = undefined;
  const columnNo = undefined;
  const layoutId = undefined;
  const lotId = undefined;
  const floor = undefined;

  // Fetch available sensors
  useEffect(() => {
    const fetchSensors = async () => {
      try {
        const user = auth.currentUser;
        if (!user) return;

        const token = await user.getIdToken();
        const res = await fetch("/api/sensors", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const data = await res.json();
        // only show sensors that are available (not assigned)
        const availableSensors = (data.data || []).filter((s: Sensor) => !s.spotId);
        setSensors(availableSensors);
      } catch (error) {
        console.error("Error fetching sensors:", error);
      }
    };
    fetchSensors();
  }, []);

  const handleCreateAndAssign = async () => {
    const newErrors: FormErrors = {};
    if (!slotName.trim()) newErrors.slotName = "Slot name is required";
    if (!vehicleType.trim()) newErrors.vehicleType = "Vehicle type is required";
    if (!selectedSensor) newErrors.selectedSensor = "Please select a sensor";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not logged in");
      const token = await user.getIdToken();

      // Create spot using the new route
      const createRes = await fetch("/api/spots", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          slotName,
          vehicleType,
          rowNo,
          columnNo,
          layoutId,
          lotId,
          floor,
          ownerId: user.uid,
        }),
      });

      const slotData = await createRes.json();
      if (!createRes.ok) throw new Error(slotData.message || "Failed to create spot");

      const spotId = slotData.data.id || slotData.data.slotId;

      // Assign sensor to the new spot
      const assignRes = await fetch(`/api/sensors/${selectedSensor}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          spotId,
          ownerId: user.uid,
          assigned: true,
        }),
      });

      const assignedSensor = await assignRes.json();
      if (!assignRes.ok) throw new Error(assignedSensor.message || "Failed to assign sensor");

      // Sync spot status to match sensor status
      const sensorStatus = assignedSensor.data?.status || "online";
      const spotStatus = sensorStatus === "offline" ? "occupied" : "available";

      const updateSpotRes = await fetch(`/api/spots/${spotId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: spotStatus,
        }),
      });

      const updatedSpot = await updateSpotRes.json();
      if (!updateSpotRes.ok)
        throw new Error(updatedSpot.message || "Failed to update spot status");

      toast.success("Slot created & sensor assigned!");
      onClose();
    } catch (error: any) {
      setErrors({ form: error.message || "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onMouseDown={onClose}
    >
      <div
        className="bg-white p-6 rounded-xl w-[400px] dark:bg-slate-900 dark:text-slate-100"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4">Create Slot & Assign Sensor</h2>

        {errors.form && (
          <p className="mb-4 flex items-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            <span aria-hidden="true">⚠</span> {errors.form}
          </p>
        )}

        <div className="mb-2">
          <label htmlFor="slot-name" className="block mb-1 text-sm text-slate-700 dark:text-slate-200">Slot Name</label>
          <input
            id="slot-name"
            className={`w-full border p-2 rounded text-slate-900 outline-none transition bg-white dark:bg-slate-800 dark:text-slate-100 ${errors.slotName ? "border-destructive" : "border-slate-300 focus:border-slate-500 dark:border-slate-700"}`}
            value={slotName}
            aria-invalid={!!errors.slotName}
            onChange={(event) => { setSlotName(event.target.value); clearFieldError("slotName"); }}
          />
          {errors.slotName && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-destructive">
              <span aria-hidden="true">⚠</span> {errors.slotName}
            </p>
          )}
        </div>

        <div className="mb-2">
          <label htmlFor="vehicle-type" className="block mb-1 text-sm text-slate-700 dark:text-slate-200">Vehicle Type</label>
          <input
            id="vehicle-type"
            className={`w-full border p-2 rounded text-slate-900 outline-none transition bg-white dark:bg-slate-800 dark:text-slate-100 ${errors.vehicleType ? "border-destructive" : "border-slate-300 focus:border-slate-500 dark:border-slate-700"}`}
            value={vehicleType}
            aria-invalid={!!errors.vehicleType}
            onChange={(event) => { setVehicleType(event.target.value); clearFieldError("vehicleType"); }}
          />
          {errors.vehicleType && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-destructive">
              <span aria-hidden="true">⚠</span> {errors.vehicleType}
            </p>
          )}
        </div>

        <div className="mb-4">
          <label htmlFor="select-sensor" className="block mb-2 text-sm text-slate-700 dark:text-slate-200">Select Sensor</label>
          <select
            id="select-sensor"
            className={`w-full border p-2 mb-1 rounded text-slate-900 outline-none transition bg-white dark:bg-slate-800 dark:text-slate-100 ${errors.selectedSensor ? "border-destructive" : "border-slate-300 focus:border-slate-500 dark:border-slate-700"}`}
            value={selectedSensor}
            aria-invalid={!!errors.selectedSensor}
            onChange={(event) => { setSelectedSensor(event.target.value); clearFieldError("selectedSensor"); }}
          >
            <option value="">-- Select Sensor --</option>
            {sensors.map((s) => (
              <option key={s.sensorId} value={s.sensorId}>
                {s.name ? `${s.name} (${s.sensorId})` : `${s.deviceId} (${s.sensorId})`}
              </option>
            ))}
          </select>
          {errors.selectedSensor && (
            <p className="flex items-center gap-1.5 text-sm text-destructive">
              <span aria-hidden="true">⚠</span> {errors.selectedSensor}
            </p>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button
            className="shadow-md active:shadow-inner active:translate-y-px bg-black text-white hover:bg-white hover:text-black hover:border-black border border-transparent dark:bg-white dark:text-black dark:hover:bg-slate-800 dark:hover:text-white dark:hover:border-slate-800 flex-1"
            onClick={handleCreateAndAssign}
            disabled={loading}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Spinner size="sm" label="Saving" />
                Saving…
              </span>
            ) : (
              "Create & Assign"
            )}
          </Button>
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
