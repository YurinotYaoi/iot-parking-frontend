import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { rtdb } from "@/lib/configs/firebaseClient";

export type SensorData = {
  spotId?: string;
  status?: string;
  distance?: number;
  lastUpdated?: number;
  [key: string]: unknown;
};

// Keyed by spotId for O(1) cell lookups during grid render.
export type SensorMap = Record<string, SensorData>;

export function useSensorMap() {
  const [sensorMap, setSensorMap] = useState<SensorMap>({});
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onValue(
      ref(rtdb, "sensors"),
      (snapshot) => {
        const result: SensorMap = {};
        if (snapshot.exists()) {
          const data = snapshot.val() as Record<string, SensorData | null>;
          for (const sensor of Object.values(data)) {
            if (sensor && sensor.spotId) {
              result[sensor.spotId] = sensor;
            }
          }
        }
        setSensorMap(result);
        setReady(true);
        setError(null);
      },
      (err) => setError(err.message)
    );
    return () => unsub();
  }, []);

  return { sensorMap, ready, error };
}
