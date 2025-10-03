import { NextRequest } from 'next/server';
import { hashPassword, setAdminSessionCookie } from '@/lib/auth';
import prisma from '@/lib/db';
import { parseRequestBody, successResponse, errorResponse, handleApiError } from '@/lib/api-utils';

/**
 * POST /api/auth/admin/register
 * Register first admin user (only works if no admins exist)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await parseRequestBody<{
      username: string;
      password: string;
      name?: string;
      email?: string;
    }>(request);

    if (!body.username || !body.password) {
      return errorResponse('Username and password are required', 400);
    }

    // Check if any admin users exist
    const adminCount = await prisma.adminUser.count();

    if (adminCount > 0) {
      return errorResponse('Admin registration is disabled. Please contact an existing administrator.', 403);
    }

    // Validate username
    if (body.username.length < 3) {
      return errorResponse('Username must be at least 3 characters', 400);
    }

    // Validate password
    if (body.password.length < 8) {
      return errorResponse('Password must be at least 8 characters', 400);
    }

    // Hash password
    const passwordHash = await hashPassword(body.password);

    // Create admin user
    const admin = await prisma.adminUser.create({
      data: {
        username: body.username,
        passwordHash,
        name: body.name || null,
        email: body.email || null,
      },
    });

    // Create session
    await setAdminSessionCookie(body.username);

    return successResponse({
      success: true,
      username: admin.username,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
