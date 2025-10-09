import { NextRequest } from 'next/server';
import { requireAdminAuth, requireClubAuth } from '@/lib/auth';
import {
  parseRequestBody,
  successResponse,
  errorResponse,
  handleApiError,
  getPathParam,
} from '@/lib/api-utils';
import prisma from '@/lib/db';

/**
 * GET /api/clubs/[id]
 * Get a specific club
 */
export async function GET(
  _request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    // Allow both admin and club access
    const club = await requireClubAuth().catch(() => null);
    const admin = await requireAdminAuth().catch(() => null);

    if (!club && !admin) {
      return errorResponse('Unauthorized', 401);
    }

    const clubId = getPathParam(params, 'id');

    // If club auth, verify it's their own club
    if (club && club.id !== clubId) {
      return errorResponse('Access denied', 403);
    }

    const clubData = await prisma.club.findUnique({
      where: { id: clubId },
      include: {
        islands: {
          include: {
            saunas: true,
          },
        },
        boats: true,
      },
    });

    if (!clubData) {
      return errorResponse('Club not found', 404);
    }

    return successResponse(clubData);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/clubs/[id]
 * Update a club (admin only)
 */
export async function PUT(
  request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    await requireAdminAuth();
    const clubId = getPathParam(params, 'id');
    const body = (await parseRequestBody(request)) as {
      name?: string;
      logoUrl?: string;
      primaryColor?: string;
      secondaryColor?: string;
      timezone?: string;
    };

    // Check if club exists
    const existing = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!existing) {
      return errorResponse('Club not found', 404);
    }

    // Update club (exclude secret - use separate endpoint for that)
    const updated = await prisma.club.update({
      where: { id: clubId },
      data: {
        name: body.name,
        logoUrl: body.logoUrl,
        primaryColor: body.primaryColor,
        secondaryColor: body.secondaryColor,
        timezone: body.timezone,
      },
    });

    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/clubs/[id]
 * Delete a club (admin only)
 */
export async function DELETE(
  _request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    await requireAdminAuth();
    const clubId = getPathParam(params, 'id');

    // Check if club exists
    const existing = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!existing) {
      return errorResponse('Club not found', 404);
    }

    // Delete club (cascade will handle related data)
    await prisma.club.delete({
      where: { id: clubId },
    });

    return successResponse({ message: 'Club deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
