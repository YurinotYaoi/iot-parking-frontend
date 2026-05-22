import { auth, db } from '@/lib/configs/firebase';
import { validateRequiredFields, isValidEmail, isValidPassword } from '@/utils/validate';
import { successResponse, errorResponse } from '@/utils/response';

export async function POST(req) {
  try {
    const body = await req.json();

    // Validate required fields
    const missing = validateRequiredFields(body, ['email', 'password', 'firstName', 'lastName']);
    if (missing) return errorResponse(missing, 400);

    // Validate email and password formats
    if (!isValidEmail(body.email)) return errorResponse('Invalid email format', 400);
    if (!isValidPassword(body.password)) return errorResponse('Password must be at least 6 characters', 400);

    // Create user using Firebase Admin Auth
    const userRecord = await auth.createUser({
      email: body.email,
      password: body.password,
    });

    // Automatically assign the user as an admin in Realtime Database
    await db.ref(`users/${userRecord.uid}`).set({
      uid: userRecord.uid,
      email: body.email,
      firstName: body.firstName,
      middleName: body.middleName || '',
      lastName: body.lastName,
      role: 'admin',
      createdAt: new Date().toISOString(),
    });

    return successResponse({ uid: userRecord.uid, email: userRecord.email, role: 'admin' }, 201);
  } catch (err) {
    console.error('Register error:', err);
    if (err.code === 'auth/email-already-exists') {
      return errorResponse('Email is already registered', 409);
    }
    return errorResponse(err.message, 500);
  }
}
