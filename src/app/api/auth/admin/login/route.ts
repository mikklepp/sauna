import { NextRequest } from 'next/server';
import { validateAdminCredentials, setAdminSessionCookie } from '@/lib/auth';
import {
  parseRequestBody,
  successResponse,
  errorResponse,
  handleApiError,
} from '@/lib/api-utils';

/**
 * POST /api/auth/admin/login
 * Admin login
 */
export async function POST(request: NextRequest) {
  try {
    const body = await parseRequestBody<{ username: string; password: string }>(
      request
    );

    if (!body.username || !body.password) {
      return errorResponse('Username and password are required', 400);
    }

    // Validate credentials
    const result = await validateAdminCredentials(body.username, body.password);

    if (!result.valid) {
      return errorResponse(result.error || 'Invalid credentials', 401);
    }

    // Create session
    await setAdminSessionCookie(body.username);

    return successResponse({
      success: true,
      username: body.username,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
