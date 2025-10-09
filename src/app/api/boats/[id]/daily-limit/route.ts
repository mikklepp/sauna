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
import { startOfDay, endOfDay } from 'date-fns';
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
    const dateStr = getQueryParam(request, 'date');

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

    // Parse date or use today
    const date = dateStr ? new Date(dateStr) : new Date();
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    // Check for individual reservations
    const individualReservation = await prisma.reservation.findFirst({
      where: {
        boatId,
        status: 'ACTIVE',
        sauna: {
          islandId,
        },
        startTime: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
      include: {
        sauna: true,
      },
    });

    // Check for shared reservation participation
    const sharedParticipation =
      await prisma.sharedReservationParticipant.findFirst({
        where: {
          boatId,
          sharedReservation: {
            sauna: {
              islandId,
            },
            date: {
              gte: dayStart,
              lte: dayEnd,
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
