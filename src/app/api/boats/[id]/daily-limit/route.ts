import { NextRequest } from 'next/server';
import { requireClubAuth } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  handleApiError,
  getPathParam,
  getQueryParam,
} from '@/lib/api-utils';
import prisma from '@/lib/db';
import { startOfDay } from 'date-fns';
import type { DailyLimitCheck } from '@/types';

/**
 * GET /api/boats/[id]/daily-limit?islandId=xxx&date=xxx
 * Check if a boat can make a reservation on an island for a given date
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const club = await requireClubAuth();
    const resolvedParams = await params;
    const boatId = getPathParam(resolvedParams, 'id');
    const islandId = getQueryParam(request, 'islandId');

    if (!islandId) {
      return errorResponse('islandId query parameter is required', 400);
    }

    // Check if boat belongs to club
    const boat = await prisma.boat.findUnique({
      where: { id: boatId },
    });

    if (!boat || boat.clubId !== club.id) {
      return errorResponse('Boat not found', 404);
    }

    // Check if island belongs to club
    const island = await prisma.island.findUnique({
      where: { id: islandId },
    });

    if (!island || island.clubId !== club.id) {
      return errorResponse('Island not found', 404);
    }

    // Calculate cutoff: if before 6 AM now, use yesterday's 6 AM; otherwise use today's 6 AM
    const now = new Date();
    const currentHour = now.getHours();
    const cutoff6am = startOfDay(now);

    if (currentHour < 6) {
      // Before 6 AM - use yesterday's 6 AM
      cutoff6am.setDate(cutoff6am.getDate() - 1);
    }
    cutoff6am.setHours(6, 0, 0, 0);

    // Check for individual reservations starting from the most recent 6am onwards
    const individualReservation = await prisma.reservation.findFirst({
      where: {
        boatId,
        status: 'ACTIVE',
        sauna: {
          islandId,
        },
        startTime: {
          gte: cutoff6am,
        },
      },
      include: {
        sauna: true,
      },
    });

    // Check for shared reservation participation starting from the most recent 6am onwards
    const sharedParticipation =
      await prisma.sharedReservationParticipant.findFirst({
        where: {
          boatId,
          sharedReservation: {
            sauna: {
              islandId,
            },
            startTime: {
              gte: cutoff6am,
            },
          },
        },
        include: {
          sharedReservation: true,
        },
      });

    const result: DailyLimitCheck = {
      canReserve: !individualReservation && !sharedParticipation,
      hasIndividualReservation: !!individualReservation,
      hasSharedParticipation: !!sharedParticipation,
    };

    if (individualReservation) {
      result.existingReservation = {
        type: 'individual',
        id: individualReservation.id,
        startTime: individualReservation.startTime,
      };
    } else if (sharedParticipation) {
      result.existingReservation = {
        type: 'shared',
        id: sharedParticipation.sharedReservationId,
        startTime: new Date(sharedParticipation.sharedReservation.startTime),
      };
    }

    return successResponse(result);
  } catch (error) {
    return handleApiError(error);
  }
}
