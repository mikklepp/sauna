import { NextRequest } from 'next/server';
import { requireAdminAuth, requireClubAuth } from '@/lib/auth';
import {
  parseRequestBody,
  successResponse,
  errorResponse,
  handleApiError,
  getQueryParam,
} from '@/lib/api-utils';
import { createSaunaSchema } from '@/lib/validation';
import prisma from '@/lib/db';

/**
 * POST /api/saunas
 * Create a new sauna (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdminAuth();
    const body = await parseRequestBody(request);

    // Validate input
    const validated = createSaunaSchema.parse(body);

    // Check if island exists
    const island = await prisma.island.findUnique({
      where: { id: validated.islandId },
    });

    if (!island) {
      return errorResponse('Island not found', 404);
    }

    // Create sauna
    const sauna = await prisma.sauna.create({
      data: validated,
      include: {
        island: {
          include: {
            club: true,
          },
        },
      },
    });

    return successResponse(sauna, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/saunas?islandId=xxx
 * Get all saunas (admin gets all, club users get their club's saunas)
 */
export async function GET(request: NextRequest) {
  try {
    // Try admin auth first
    try {
      await requireAdminAuth();

      // Admin users get all saunas across all clubs
      const islandId = getQueryParam(request, 'islandId');
      const where: { islandId?: string } = {};

      if (islandId) {
        where.islandId = islandId;
      }

      const saunas = await prisma.sauna.findMany({
        where,
        include: {
          island: {
            include: {
              club: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });

      return successResponse(saunas);
    } catch {
      // Fall back to club auth
      const club = await requireClubAuth();
      const islandId = getQueryParam(request, 'islandId');

      // Build where clause
      const where: { islandId?: string; island?: { clubId: string } } = {};

      if (islandId) {
        // Verify island belongs to authenticated club
        const island = await prisma.island.findUnique({
          where: { id: islandId },
        });

        if (!island || island.clubId !== club.id) {
          return errorResponse('Island not found', 404);
        }

        where.islandId = islandId;
      } else {
        // Get all saunas for club's islands
        where.island = {
          clubId: club.id,
        };
      }

      const saunas = await prisma.sauna.findMany({
        where,
        include: {
          island: {
            include: {
              club: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });

      return successResponse(saunas);
    }
  } catch (error) {
    return handleApiError(error);
  }
}
