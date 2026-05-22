import { auth as adminAuth, db } from '@/lib/configs/firebase';

export async function verifyToken(token) {
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return decoded;
  } catch (err) {
    console.error('Token verification failed:', err.message);
    throw new Error('Invalid or expired token');
  }
}

export async function getUserByUid(uid) {
  try {
    const snapshot = await db.ref(`users/${uid}`).once('value');
    const userData = snapshot.val();
    if (!userData) {
      throw new Error('User not found');
    }
    return userData;
  } catch (err) {
    console.error('Failed to fetch user:', err.message);
    throw err;
  }
}