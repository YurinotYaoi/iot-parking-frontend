import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

import { withAuth } from '@/utils/withAuth';
import { errorResponse, successResponse } from '@/utils/response';

export const runtime = 'nodejs';

const execFileAsync = promisify(execFile);

export const GET = withAuth(async (req) => {
  const { searchParams } = new URL(req.url);
  const layoutId = searchParams.get('layoutId');

  if (!layoutId || !/^[A-Za-z0-9_-]{1,128}$/.test(layoutId)) {
    return errorResponse('A valid layoutId is required', 400);
  }

  const pythonExecutable = process.env.PYTHON_EXECUTABLE || 'python';
  const scriptPath = path.join(process.cwd(), 'machine_learning', 'parking_ml.py');

  try {
    const { stdout } = await execFileAsync(
      pythonExecutable,
      [scriptPath, '--layout-id', layoutId, '--json'],
      {
        cwd: process.cwd(),
        env: process.env,
        timeout: 120000,
        maxBuffer: 1024 * 1024,
      },
    );

    return successResponse(JSON.parse(stdout.trim()));
  } catch (error) {
    console.error('Sensor history prediction failed:', error);
    return errorResponse('Unable to generate a parking demand prediction', 502);
  }
});