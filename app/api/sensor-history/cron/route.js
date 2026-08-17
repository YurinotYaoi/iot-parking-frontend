import { ensureSensorHistoryScheduler } from '@/lib/sensorHistoryScheduler';
import { successResponse, errorResponse } from '@/utils/response';

export async function GET() {
  try {
    const status = ensureSensorHistoryScheduler();
    return successResponse({
      message: 'Sensor history scheduler initialized',
      ...status,
    });
  } catch (err) {
    return errorResponse(err.message, 500);
  }
}
