import { NextRequest } from 'next/server';
import { requireClubAuth, requireAdminAuth } from '@/lib/auth';
import {
  parseRequestBody,
  successResponse,
  errorResponse,
  handleApiError,
} from '@/lib/api-utils';
import { createBoatSchema } from '@/lib/validation';
import prisma from '@/lib/db';

/**
 * POST /api/boats
 * Create a new boat (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdminAuth();
    const body = await parseRequestBody(request);

    // Validate input
    const validated = createBoatSchema.parse(body);

    // Check if membership number already exists in club
    const existing = await prisma.boat.findFirst({
      where: {
        clubId: validated.clubId,
        membershipNumber: validated.membershipNumber,
      },
    });

    if (existing) {
      return errorResponse(
        'A boat with this membership number already exists',
        409
      );
    }

    // Create boat
    const boat = await prisma.boat.create({
      data: validated,
    });

    return successResponse(boat, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/boats?clubId=xxx
 * Get all boats (admin gets all, club users get their club's boats)
 */
export async function GET(_request: NextRequest) {
  try {
    // Try admin auth first
    try {
      await requireAdminAuth();

      // Admin users get all boats across all clubs
      const boats = await prisma.boat.findMany({
        include: {
          club: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });

      return successResponse(boats);
    } catch {
      // Fall back to club auth
      const club = await requireClubAuth();

      const boats = await prisma.boat.findMany({
        where: {
          clubId: club.id,
        },
        include: {
          club: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });

      return successResponse(boats);
    }
  } catch (error) {
    return handleApiError(error);
  }
}
