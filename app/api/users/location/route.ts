// ============================================================
// ROUTE: /api/users/location
// PATCH — update user's location
// ============================================================

import { NextRequest } from 'next/server';
import { withAuth } from '@/utils/withAuth';
import { updateUserLocation } from '@/services/userService';
import { successResponse, errorResponse } from '@/utils/response';

export const PATCH = withAuth(async (req: NextRequest) => {
  try {
    const { name, link } = await req.json();
    const updatedUser = await updateUserLocation(
      (req as NextRequest & { user: { uid: string } }).user.uid,
      { name, link },
    );
    return successResponse(updatedUser);
  } catch (err: any) {
    return errorResponse(err.message, 500);
  }
});