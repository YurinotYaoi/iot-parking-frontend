"use client";

import { useState, useEffect, useRef } from "react";
import { auth, rtdb } from "@/lib/configs/firebaseClient";
import { ref, update } from "firebase/database";

interface SensorInfo {
  sensorId: string;
  status?: "free" | "occupied" | "error";
  lastUpdated?: number;
  deviceId?: string;
  spotId?: string;
  distance?: number;
}

//These are three buttons that simulate the sensors. When clicked, they will simulate a distance reading and update the sensor status in Firebase Realtime Database directly, skipping the backend API. The button color indicates the current status of the sensor (green for free, red for occupied).
export default function SensorSimulate() {
  const [sensors, setSensors] = useState<SensorInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastStateRef = useRef<{ [key: string]: boolean }>({});

  const THRESHOLD = 0.18; // Like Arduino code

  // Fetch sensors on mount
  useEffect(() => { 
    const fetchSensors = async () => {
      try {
        // Get Firebase auth token
        const user = auth.currentUser;
        if (!user) {
          setError("Not authenticated");
          setLoading(false);
          return;
        }

        const token = await user.getIdToken();

        // Fetch sensors with Authorization header
        const response = await fetch("/api/sensors", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) throw new Error("Failed to fetch sensors");
        const data = await response.json();
        setSensors(data.data || []);
        
        // Initialize last state tracking
        const sensors_data = data.data || [];
        sensors_data.forEach((sensor: SensorInfo) => {
          lastStateRef.current[sensor.sensorId] = sensor.status === "occupied";
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchSensors();
  }, []);

  // Simulated sensor check - write directly to Firebase (skip backend)
  const checkSensor = async (sensor: SensorInfo) => {
    try {
      // Simulate distance reading (0-1 meters)
      const simulatedDistance = Math.random() * 1;
      const newOccupied = simulatedDistance <= THRESHOLD;
      const newStatus = newOccupied ? "occupied" : "free";

      // Get last state (default to false if not tracked)
      const lastOccupied = lastStateRef.current[sensor.sensorId] ?? false;

      // Only update if state changed (like Arduino: "if (occupied != lastState[index])")
      if (newOccupied === lastOccupied) {
        console.log(`Sensor ${sensor.sensorId}: No state change, skipping update`);
        return;
      }

      // State changed, update Firebase directly (skip backend)
      console.log(`Sensor ${sensor.sensorId}: State changed, updating Firebase...`);
      lastStateRef.current[sensor.sensorId] = newOccupied;

      // Write directly to Firebase Realtime Database
      const sensorRef = ref(rtdb, `sensors/${sensor.sensorId}`);
      await update(sensorRef, {
        status: newStatus,
        distance: simulatedDistance,
        lastUpdated: Date.now(),
      });

      // Update local state
      setSensors((prev) =>
        prev.map((s) =>
          s.sensorId === sensor.sensorId
            ? { 
                ...s, 
                status: newStatus as "free" | "occupied" | "error",
                distance: simulatedDistance,
                lastUpdated: Date.now()
              }
            : s
        )
      );

      console.log(`Sensor ${sensor.sensorId}: Updated ✅`);
    } catch (err) {
      console.error(`Sensor ${sensor.sensorId}: Error ❌`, err);
      setError(err instanceof Error ? err.message : "Unknown error");
    }
  };

  if (loading) return <div>Loading sensors...</div>;
  if (error) return <div>Error: {error}</div>;
  if (sensors.length === 0) return <div>No sensors found</div>;

  return (
    <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
      {sensors.map((sensor) => (
        <button
          key={sensor.sensorId}
          onClick={() => checkSensor(sensor)}
          style={{
            padding: "8px 12px",
            cursor: "pointer",
            backgroundColor: sensor.status === "free" ? "#90EE90" : "#FF6B6B",
            color: "black",
            border: "none",
            borderRadius: "4px",
            fontSize: "12px",
          }}
          title={`Distance: ${sensor.distance?.toFixed(2)}m\nLast Updated: ${new Date(sensor.lastUpdated || 0).toLocaleTimeString()}`}
        >
          {sensor.deviceId}
          <br />
          ({sensor.status})
          <br />
          {sensor.distance?.toFixed(2)}m
        </button>
      ))}
    </div>
  );
}
