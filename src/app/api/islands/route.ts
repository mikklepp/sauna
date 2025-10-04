import { NextRequest } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { parseRequestBody, successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import prisma from '@/lib/db';

/**
 * GET /api/islands
 * Get all islands (admin only)
 */
export async function GET(_request: NextRequest) {
  try {
    await requireAdminAuth();

    const islands = await prisma.island.findMany({
      include: {
        club: {
          select: {
            id: true,
            name: true,
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
    const body = await parseRequestBody<{ name: string; clubId: string }>(request);

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
