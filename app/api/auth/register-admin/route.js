import { registerUser } from '@/services/authService';
import { db } from '@/lib/configs/firebase';
import { successResponse, errorResponse } from '@/utils/response';

export async function POST(req) {
  const { secretKey, ...userData } = await req.json();

  // Validate secret key for admin registration
  if (secretKey !== process.env.ADMIN_SECRET_KEY) {
    return errorResponse('Invalid secret key', 403);
  }

  const user = await registerUser({ ...userData, role: 'admin' });
  // Override the role to admin in DB
  await db.ref(`users/${user.uid}/role`).set('admin');
  return successResponse({ uid: user.uid, role: 'admin' }, 201);
}