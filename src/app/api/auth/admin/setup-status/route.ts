import { NextRequest } from 'next/server';
import prisma from '@/lib/db';
import { successResponse, handleApiError } from '@/lib/api-utils';

/**
 * GET /api/auth/admin/setup-status
 * Check if admin setup is needed
 */
export async function GET(_request: NextRequest) {
  try {
    const adminCount = await prisma.adminUser.count();

    return successResponse({
      needsSetup: adminCount === 0,
      hasAdmins: adminCount > 0,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
