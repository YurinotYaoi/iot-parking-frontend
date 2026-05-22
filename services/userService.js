import admin from 'firebase-admin';
import { db } from '@/lib/configs/firebase';
import { isValidEmail, isValidPassword } from '@/utils/validate';

export async function getAllUsers() {
  const snapshot = await db.ref('users').once('value');
  const data = snapshot.val();
  if (!data) return [];
  return Object.entries(data).map(([uid, user]) => ({ uid, ...user }));
}

export async function getUserByUid(uid) {
  const snapshot = await db.ref(`users/${uid}`).once('value');
  return snapshot.val();
}

export async function updateUser(uid, updates) {
  const allowed = ['firstName', 'middleName', 'lastName', 'phoneNumber', 'isActive'];
  const sanitized = {};
  for (const key of allowed) {
    if (updates[key] !== undefined) sanitized[key] = updates[key];
  }

  // email and password live in Firebase Auth, not the Realtime DB.
  // Build a separate payload for admin.auth().updateUser, and mirror email into the DB.
  const authUpdates = {};
  if (updates.email) {
    if (!isValidEmail(updates.email)) throw new Error('Invalid email format');
    authUpdates.email = updates.email;
    sanitized.email = updates.email;
  }
  if (updates.password) {
    if (!isValidPassword(updates.password)) {
      throw new Error('Password must be at least 6 characters');
    }
    authUpdates.password = updates.password;
  }

  sanitized.updatedAt = Date.now();
  await db.ref(`users/${uid}`).update(sanitized);

  if (updates.firstName || updates.middleName || updates.lastName) {
    const snapshot = await db.ref(`users/${uid}`).once('value');
    const user = snapshot.val();
    authUpdates.displayName = [user.firstName, user.middleName, user.lastName]
      .filter(Boolean).join(' ');
  }

  if (Object.keys(authUpdates).length > 0) {
    await admin.auth().updateUser(uid, authUpdates);
  }

  return { uid, ...sanitized };
}

export async function deleteUser(uid) {
  await admin.auth().deleteUser(uid);
  await db.ref(`users/${uid}`).remove();
  return { uid, deleted: true };
}

export async function updateUserLocation(uid, location) {
  await db.ref(`users/${uid}`).update({ location, updatedAt: Date.now() });
  return { uid, location };
}