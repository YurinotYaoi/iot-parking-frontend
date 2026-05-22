import { db } from '@/lib/configs/firebase';
import { v4 as uuidv4 } from 'uuid';

export async function getAllParkingLots() {
  const snapshot = await db.ref('parkingLots').once('value');
  const data = snapshot.val();
  if (!data) return [];
  return Object.entries(data).map(([lotId, lot]) => ({ lotId, ...lot }));
}

export async function getParkingLotById(lotId) {
  const snapshot = await db.ref(`parkingLots/${lotId}`).once('value');
  return snapshot.val();
}

export async function getParkingLotsByAdmin(adminUid) {
  const snapshot = await db.ref('parkingLots')
    .orderByChild('adminUid')
    .equalTo(adminUid)
    .once('value');
  const data = snapshot.val();
  if (!data) return [];
  return Object.entries(data).map(([lotId, lot]) => ({ lotId, ...lot }));
}

export async function createParkingLot(adminUid, data) {
  const lotId = uuidv4();
  const lot = {
    adminUid,
    locationName: data.locationName,
    description: data.description || '',
    googleMapsLink: data.googleMapsLink || '',
    totalSpace: data.totalSpace || 0,
    isActive: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await db.ref(`parkingLots/${lotId}`).set(lot);
  return { lotId, ...lot };
}

export async function updateParkingLot(lotId, updates) {
  const allowed = ['locationName', 'description', 'googleMapsLink', 'totalSpace', 'isActive'];
  const sanitized = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) sanitized[key] = updates[key];
  }
  sanitized.updatedAt = Date.now();
  await db.ref(`parkingLots/${lotId}`).update(sanitized);
  return { lotId, ...sanitized };
}

export async function deleteParkingLot(lotId) {
  await db.ref(`parkingLots/${lotId}`).remove();
  return { lotId, deleted: true };
}