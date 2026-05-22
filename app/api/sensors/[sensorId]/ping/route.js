"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/configs/firebaseClient";

type Props = {
  onClose: () => void;
  preCreatedSlotId?: string; // optional: if you want to PATCH an existing slot
};

type Sensor = {
  id: string;
  deviceId: string;
  spotId?: string;
};

export default function CreateSensorModal({ onClose, preCreatedSlotId }: Props) {
  const [sensors, setSensors] = useState<Sensor[]>([]);
  const [slotName, setSlotName] = useState("");
  const [vehicleType, setVehicleType] = useState("");
  const [label, setLabel] = useState("");
  const [selectedSensor, setSelectedSensor] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch available sensors (only those not assigned to a spot)
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

        const availableSensors = (data.data || []).filter((s: Sensor) => !s.spotId);
        setSensors(availableSensors);
      } catch (err) {
        console.error("Error fetching sensors:", err);
      }
    };

    fetchSensors();
  }, []);

  const handleCreateAndAssign = async () => {
    if (!slotName || !vehicleType || !label || !selectedSensor) {
      alert("Please fill all fields and select a sensor");
      return;
    }

    setLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("Not logged in");
      const token = await user.getIdToken();

      // 1️⃣ Update/Create the slot (PATCH preCreatedSlotId for now)
      if (!preCreatedSlotId) throw new Error("Slot ID is required for now");

      const patchSlotRes = await fetch(`/api/spots/${preCreatedSlotId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          slotName,
          vehicleType,
          label,
          ownerId: user.uid,
          // rowNo, columnNo, floor, layoutId can be added later
        }),
      });

      const patchedSlot = await patchSlotRes.json();
      if (!patchSlotRes.ok) throw new Error(patchedSlot.message || "Failed to update slot");

      const slotId = patchedSlot.data.slotId || preCreatedSlotId;

      // 2️⃣ Assign the selected sensor to this slot
      const assignSensorRes = await fetch("/api/sensors", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          spotId: slotId,
          deviceId: selectedSensor,
        }),
      });

      const assignedSensor = await assignSensorRes.json();
      if (!assignSensorRes.ok) throw new Error(assignedSensor.message || "Failed to assign sensor");

      alert("Slot updated and sensor assigned!");
      onClose();
    } catch (err: any) {
      alert(err.message);
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
        className="bg-white p-6 rounded-xl w-[400px]"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4">Create Slot & Assign Sensor</h2>

        <label className="block mb-1 text-sm">Slot Name</label>
        <input
          className="w-full border p-2 rounded mb-2"
          value={slotName}
          onChange={(event) => setSlotName(event.target.value)}
        />

        <label className="block mb-1 text-sm">Vehicle Type</label>
        <input
          className="w-full border p-2 rounded mb-2"
          value={vehicleType}
          onChange={(event) => setVehicleType(event.target.value)}
        />

        <label className="block mb-1 text-sm">Label</label>
        <input
          className="w-full border p-2 rounded mb-4"
          value={label}
          onChange={(event) => setLabel(event.target.value)}
        />

        <label className="block mb-2 text-sm">Select Sensor</label>
        <select
          className="w-full border p-2 rounded mb-4"
          value={selectedSensor}
          onChange={(event) => setSelectedSensor(event.target.value)}
        >
          <option value="">-- Select Sensor --</option>
          {sensors.map((sensor) => (
            <option key={sensor.id} value={sensor.id}>
              {sensor.deviceId}
            </option>
          ))}
        </select>

        <div className="flex justify-end gap-2">
          <button className="px-4 py-2 bg-gray-300 rounded" onClick={onClose}>
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded"
            onClick={handleCreateAndAssign}
            disabled={loading}
          >
            {loading ? "Saving..." : "Create & Assign"}
          </button>
        </div>
      </div>
    </div>
  );
}