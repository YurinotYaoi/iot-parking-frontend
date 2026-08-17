
import { db } from '@/lib/configs/firebase';

const FIVE_MINUTES_MS = 5 * 60 * 1000;
let intervalHandle = null;

const normalizeOccupancyStatus = (value) => {
  if (value === undefined || value === null || value === '') return 'free';

  const status = String(value).trim().toLowerCase();
  if (status === 'available') return 'free';
  if (status === 'free') return 'free';
  if (status === 'occupied') return 'occupied';
  if (status === 'online' || status === 'offline' || status === 'unknown') return 'free';

  return status;
};

export async function buildLayoutHistorySnapshot(layoutId) {
  const layoutSnapshot = await db.ref(`layouts/${layoutId}`).once('value');
  const layout = layoutSnapshot.val();

  if (!layout) {
    return null;
  }

  const sensorsSnapshot = await db.ref('sensors').once('value');
  const sensors = sensorsSnapshot.val() || {};

  const sensorBySpotId = {};
  for (const sensor of Object.values(sensors)) {
    if (sensor && sensor.spotId) {
      sensorBySpotId[sensor.spotId] = sensor;
    }
  }

  let totalSlots = 0;
  let occupiedSlots = 0;
  let vacantSlots = 0;

  const grid = Array.isArray(layout.grid) ? layout.grid : Object.values(layout.grid || {});

  for (const row of grid) {
    const cells = Array.isArray(row) ? row : Object.values(row || {});

    for (const cell of cells) {
      if (!cell || cell.type !== 'slot') continue;

      totalSlots++;

      const spotId = cell.spotId || cell.spotData?.slotId || cell.spotData?.spotId;
      const sensor = spotId ? sensorBySpotId[spotId] : null;
      const rawStatus = sensor?.status ?? cell.spotData?.status ?? 'free';
      const normalized = normalizeOccupancyStatus(rawStatus);

      if (normalized === 'occupied') {
        occupiedSlots++;
      } else {
        vacantSlots++;
      }
    }
  }

  return {
    layoutId,
    timestamp: Date.now(),
    day: new Date().toISOString().split('T')[0],
    hour: new Date().getHours(),
    totalSlots,
    occupiedSlots,
    vacantSlots,
    occupancyRate: totalSlots ? occupiedSlots / totalSlots : 0,
  };
}

export async function saveLayoutHistorySnapshot(layoutId) {
  const snapshot = await buildLayoutHistorySnapshot(layoutId);
  if (!snapshot) return null;

  await db.ref(`sensorHistory/${layoutId}`).push(snapshot);
  return snapshot;
}

export async function saveAllLayoutHistorySnapshots() {
  const snapshot = await db.ref('layouts').once('value');
  const layouts = snapshot.val() || {};

  const results = [];
  for (const layoutId of Object.keys(layouts)) {
    const data = await saveLayoutHistorySnapshot(layoutId);
    if (data) results.push(data);
  }

  return results;
}

export function ensureSensorHistoryScheduler() {
  if (typeof window !== 'undefined') return { started: false, reason: 'client-side only' };
  if (intervalHandle) return { started: true, intervalMs: FIVE_MINUTES_MS };

  const run = async () => {
    try {
      const results = await saveAllLayoutHistorySnapshots();
      console.log(`[sensorHistory] Saved ${results.length} layout snapshot(s)`);
    } catch (error) {
      console.error('[sensorHistory] Scheduled snapshot failed:', error);
    }
  };

  intervalHandle = setInterval(run, FIVE_MINUTES_MS);
  intervalHandle.unref?.();

  run().catch((error) => {
    console.error('[sensorHistory] Initial snapshot failed:', error);
  });

  return { started: true, intervalMs: FIVE_MINUTES_MS };
}
