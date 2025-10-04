import { NextRequest } from 'next/server';
import { getAdminFromSession } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  handleApiError,
} from '@/lib/api-utils';

/**
 * GET /api/auth/admin/me
 * Get current admin user info
 */
export async function GET(_request: NextRequest) {
  try {
    const admin = await getAdminFromSession();

    if (!admin) {
      return errorResponse('Not authenticated', 401);
    }

    return successResponse({
      username: admin.username,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
