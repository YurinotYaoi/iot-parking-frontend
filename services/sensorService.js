// ============================================================
// SERVICE: sensorService.js
// Handles all Sensor CRUD against Firebase Realtime DB
// Also handles ESP32 ping which atomically updates sensor + spot
// Used by: /api/sensors, /api/sensors/[sensorId]
//          /api/sensors/[sensorId]/ping
// ============================================================

import { db } from '@/lib/configs/firebase';
import { updateSpotStatus } from './spotService';
import { v4 as uuidv4 } from 'uuid';

const VALID_SENSOR_STATUSES = ['online', 'offline', 'error'];

export async function getAllSensors() {
  const snapshot = await db.ref('sensors').once('value');
  const data = snapshot.val();
  if (!data) return [];
  return Object.entries(data).map(([sensorId, sensor]) => ({ sensorId, ...sensor }));
}

export async function getSensorBySpot(spotId) {
  const snapshot = await db.ref('sensors')
    .orderByChild('spotId')
    .equalTo(spotId)
    .once('value');
  const data = snapshot.val();
  if (!data) return null;
  const [sensorId, sensor] = Object.entries(data)[0];
  return { sensorId, ...sensor };
}

export async function getSensorById(sensorId) {
  const snapshot = await db.ref(`sensors/${sensorId}`).once('value');
  return snapshot.val();
}

export async function createSensor(spotId, data) {
  const sensorId = uuidv4();
  const sensor = {
    spotId,
    deviceId: data.deviceId,
    status: 'offline',
    lastPingAt: null,
    createdAt: Date.now(),
  };
  await db.ref(`sensors/${sensorId}`).set(sensor);
  return { sensorId, ...sensor };
}

export async function updateSensor(sensorId, updates) {
  const allowed = ['deviceId', 'status', 'spotId', 'ownerId', 'assigned'];
  const sanitized = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) sanitized[key] = updates[key];
  }
  if (sanitized.status && !VALID_SENSOR_STATUSES.includes(sanitized.status)) {
    throw new Error(`Invalid sensor status. Must be: ${VALID_SENSOR_STATUSES.join(', ')}`);
  }
  await db.ref(`sensors/${sensorId}`).update(sanitized);
  
  // Sync sensor status to spot if assigned
  if (sanitized.spotId && sanitized.status) {
    await updateSpotStatus(sanitized.spotId, sanitized.status === 'offline' ? 'occupied' : 'available');
  }
  
  return { sensorId, ...sanitized };
}

export async function deleteSensor(sensorId) {
  await db.ref(`sensors/${sensorId}`).remove();
  return { sensorId, deleted: true };
}

// Called by ESP32 /ping — atomically updates sensor health + spot status
export async function handleSensorPing(sensorId, { isOccupied }) {
  const snapshot = await db.ref(`sensors/${sensorId}`).once('value');
  const sensor = snapshot.val();
  if (!sensor) throw new Error('Sensor not found');

  const now = Date.now();
  await db.ref(`sensors/${sensorId}`).update({ status: 'online', lastPingAt: now });

  const spotStatus = isOccupied ? 'occupied' : 'available';
  await updateSpotStatus(sensor.spotId, spotStatus);

  return { sensorId, spotId: sensor.spotId, spotStatus, lastPingAt: now };
}