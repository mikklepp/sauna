import { NextRequest } from 'next/server';
import { requireClubAuth } from '@/lib/auth';
import {
  parseRequestBody,
  successResponse,
  errorResponse,
  handleApiError,
  getPathParam,
} from '@/lib/api-utils';
import { joinSharedReservationSchema } from '@/lib/validation';
import prisma from '@/lib/db';
import { startOfDay, endOfDay } from 'date-fns';

/**
 * POST /api/shared-reservations/[id]/join
 * Join a shared reservation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const club = await requireClubAuth();
    const sharedReservationId = getPathParam(params, 'id');
    const body = (await parseRequestBody(request)) as {
      boatId?: string;
      adults?: number;
      kids?: number;
    };

    // Validate input
    const validated = joinSharedReservationSchema.parse({
      boatId: body.boatId,
      adults: body.adults,
      kids: body.kids,
      sharedReservationId,
    });

    // Get shared reservation
    const sharedReservation = await prisma.sharedReservation.findUnique({
      where: { id: sharedReservationId },
      include: {
        sauna: {
          include: {
            island: true,
          },
        },
        participants: true,
      },
    });

    if (!sharedReservation) {
      return errorResponse('Shared reservation not found', 404);
    }

    // Check if belongs to club
    if (sharedReservation.sauna.island.clubId !== club.id) {
      return errorResponse('Shared reservation not found', 404);
    }

    // Check if boat exists and belongs to club
    const boat = await prisma.boat.findUnique({
      where: { id: validated.boatId },
    });

    if (!boat || boat.clubId !== club.id) {
      return errorResponse('Boat not found', 404);
    }

    // Check if boat already participating
    const alreadyParticipating = sharedReservation.participants.some(
      (p) => p.boatId === validated.boatId
    );

    if (alreadyParticipating) {
      return errorResponse(
        'This boat is already participating in this shared reservation',
        409
      );
    }

    // Check if boat has any other reservation on this island today
    const date = new Date(sharedReservation.date);
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    // Check individual reservations
    const individualReservation = await prisma.reservation.findFirst({
      where: {
        boatId: validated.boatId,
        status: 'ACTIVE',
        sauna: {
          islandId: sharedReservation.sauna.islandId,
        },
        startTime: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    });

    if (individualReservation) {
      return errorResponse(
        'This boat already has an individual reservation on the island today',
        409
      );
    }

    // Check other shared reservations
    const otherSharedParticipation =
      await prisma.sharedReservationParticipant.findFirst({
        where: {
          boatId: validated.boatId,
          sharedReservationId: {
            not: sharedReservationId,
          },
          sharedReservation: {
            sauna: {
              islandId: sharedReservation.sauna.islandId,
            },
            date: {
              gte: dayStart,
              lte: dayEnd,
            },
          },
        },
      });

    if (otherSharedParticipation) {
      return errorResponse(
        'This boat already has a shared reservation on the island today',
        409
      );
    }

    // Add participant
    const participant = await prisma.sharedReservationParticipant.create({
      data: {
        sharedReservationId,
        boatId: validated.boatId,
        adults: validated.adults,
        kids: validated.kids,
      },
      include: {
        boat: true,
        sharedReservation: {
          include: {
            sauna: true,
          },
        },
      },
    });

    return successResponse(participant, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
