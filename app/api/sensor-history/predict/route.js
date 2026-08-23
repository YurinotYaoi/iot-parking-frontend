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
    const stderr = error?.stderr?.trim();
    const details = stderr || error?.message || 'Unknown prediction service error';
    console.error('Sensor history prediction failed:', details);

    if (error?.code === 'ENOENT') {
      return errorResponse(
        'Prediction service is unavailable: Python is not installed or PYTHON_EXECUTABLE is invalid',
        502,
      );
    }

    if (details.includes('No module named')) {
      return errorResponse(
        'Prediction service is unavailable: Python dependencies are not installed',
        502,
      );
    }

    if (details.includes('Not enough sensor history')) {
      return errorResponse(
        'Not enough sensor history to generate a prediction yet',
        422,
      );
    }

    if (details.includes('HTTP Error 401') || details.includes('HTTP Error 403')) {
      return errorResponse(
        'Prediction service cannot read Firebase sensor history; check its database credentials',
        502,
      );
    }

    return errorResponse('Unable to generate a parking demand prediction', 502);
  }
});