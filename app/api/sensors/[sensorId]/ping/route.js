// ============================================================
// ROUTE: /api/sensors/[sensorId]/ping
// POST — heartbeat + occupancy update from an IoT device (ESP32)
//
// Called by the physical sensor, NOT a logged-in admin, so this
// route does not use withAuth (which requires a Firebase user
// token). Instead it accepts an optional device key, mirroring
// the ADMIN_SECRET_KEY pattern used by /api/auth/register-admin.
//
// Body: { isOccupied: boolean, deviceKey?: string }
// Delegates the atomic sensor+spot update to handleSensorPing().
// ============================================================

import { handleSensorPing } from '@/services/sensorService';
import { successResponse, errorResponse } from '@/utils/response';

export async function POST(req, { params }) {
  try {
    const { sensorId } = await params;

    if (!sensorId) {
      return errorResponse('Sensor ID is required', 400);
    }

    let body = {};
    try {
      body = await req.json();
    } catch {
      // Allow an empty body — treated as a plain heartbeat (not occupied)
      body = {};
    }

    // Optional device authentication. If SENSOR_DEVICE_KEY is configured,
    // the device must send a matching key. If it's not configured, the
    // endpoint stays open (useful for local dev / first-time setup).
    const expectedKey = process.env.SENSOR_DEVICE_KEY;
    if (expectedKey && body.deviceKey !== expectedKey) {
      return errorResponse('Invalid device key', 403);
    }

    // Coerce isOccupied into a strict boolean. Accepts true/false,
    // "true"/"false", or 1/0 so different firmware payloads still work.
    const raw = body.isOccupied;
    const isOccupied =
      raw === true ||
      raw === 1 ||
      raw === '1' ||
      (typeof raw === 'string' && raw.toLowerCase() === 'true');

    const result = await handleSensorPing(sensorId, { isOccupied });

    return successResponse(result);
  } catch (err) {
    console.error('Sensor ping error:', err);
    if (err.message === 'Sensor not found') {
      return errorResponse('Sensor not found', 404);
    }
    return errorResponse(err.message, 500);
  }
}
