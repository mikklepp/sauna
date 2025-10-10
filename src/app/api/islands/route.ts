import { NextRequest } from 'next/server';
import {
  requireAdminAuth,
  getAdminFromSession,
  getClubFromSession,
} from '@/lib/auth';
import {
  parseRequestBody,
  successResponse,
  errorResponse,
  handleApiError,
} from '@/lib/api-utils';
import prisma from '@/lib/db';

/**
 * GET /api/islands
 * Get all islands for the authenticated user (admin or club member)
 * - Admin: returns all islands
 * - Club member: returns islands belonging to their club
 */
export async function GET(_request: NextRequest) {
  try {
    // Check if user is admin or club member
    const admin = await getAdminFromSession();
    const club = await getClubFromSession();

    if (!admin && !club) {
      return errorResponse('Unauthorized', 401);
    }

    // Build query based on user type
    const whereClause = club ? { clubId: club.id } : {};

    const islands = await prisma.island.findMany({
      where: whereClause,
      include: {
        club: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            primaryColor: true,
            secondaryColor: true,
          },
        },
        saunas: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            saunas: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return successResponse(islands);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/islands
 * Create a new island (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdminAuth();
    const body = await parseRequestBody<{ name: string; clubId: string }>(
      request
    );

    if (!body.name || !body.clubId) {
      return errorResponse('Name and clubId are required', 400);
    }

    // Check if club exists
    const club = await prisma.club.findUnique({
      where: { id: body.clubId },
    });

    if (!club) {
      return errorResponse('Club not found', 404);
    }

    // Create island
    const island = await prisma.island.create({
      data: {
        name: body.name,
        clubId: body.clubId,
      },
      include: {
        club: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            primaryColor: true,
            secondaryColor: true,
          },
        },
        saunas: true,
      },
    });

    return successResponse(island, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
