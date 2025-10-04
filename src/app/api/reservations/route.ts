import { NextRequest } from 'next/server';
import { requireClubAuth } from '@/lib/auth';
import {
  parseRequestBody,
  successResponse,
  errorResponse,
  handleApiError,
  getQueryParam,
} from '@/lib/api-utils';
import { createReservationSchema } from '@/lib/validation';
import { validateTimeSlot, isSlotAvailable } from '@/lib/availability';
import prisma from '@/lib/db';
import { startOfDay, endOfDay, addHours } from 'date-fns';

/**
 * POST /api/reservations
 * Create a new individual reservation
 */
export async function POST(request: NextRequest) {
  try {
    const club = await requireClubAuth();
    const body = await parseRequestBody(request);

    // Validate input
    const validated = createReservationSchema.parse(body);

    // Validate time slot format
    const endTime = addHours(validated.startTime, 1);
    const timeSlotValidation = validateTimeSlot(validated.startTime, endTime);
    if (!timeSlotValidation.valid) {
      return errorResponse(timeSlotValidation.error!, 400);
    }

    // Check if sauna exists and belongs to club
    const sauna = await prisma.sauna.findUnique({
      where: { id: validated.saunaId },
      include: { island: true },
    });

    if (!sauna || sauna.island.clubId !== club.id) {
      return errorResponse('Sauna not found', 404);
    }

    // Check if boat exists and belongs to club
    const boat = await prisma.boat.findUnique({
      where: { id: validated.boatId },
    });

    if (!boat || boat.clubId !== club.id) {
      return errorResponse('Boat not found', 404);
    }

    // Check if boat already has a reservation on this island today
    const today = new Date(validated.startTime);
    const dayStart = startOfDay(today);
    const dayEnd = endOfDay(today);

    // Check individual reservations
    const existingIndividualReservation = await prisma.reservation.findFirst({
      where: {
        boatId: validated.boatId,
        status: 'ACTIVE',
        sauna: {
          islandId: sauna.islandId,
        },
        startTime: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    });

    if (existingIndividualReservation) {
      return errorResponse(
        'This boat already has a reservation on the island today',
        409
      );
    }

    // Check shared reservation participation
    const sharedParticipation =
      await prisma.sharedReservationParticipant.findFirst({
        where: {
          boatId: validated.boatId,
          sharedReservation: {
            saunaId: validated.saunaId,
            date: {
              gte: dayStart,
              lte: dayEnd,
            },
          },
        },
      });

    if (sharedParticipation) {
      return errorResponse(
        'This boat already has a shared reservation on the island today',
        409
      );
    }

    // Check if time slot is available
    const existingReservations = await prisma.reservation.findMany({
      where: {
        saunaId: validated.saunaId,
        status: 'ACTIVE',
        startTime: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
    });

    const available = isSlotAvailable(
      validated.startTime,
      endTime,
      existingReservations
    );

    if (!available) {
      return errorResponse('This time slot is not available', 409);
    }

    // Create reservation
    const reservation = await prisma.reservation.create({
      data: {
        saunaId: validated.saunaId,
        boatId: validated.boatId,
        startTime: validated.startTime,
        endTime,
        adults: validated.adults,
        kids: validated.kids,
        status: 'ACTIVE',
      },
      include: {
        sauna: true,
        boat: true,
      },
    });

    return successResponse(reservation, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/reservations?saunaId=xxx&date=xxx
 * Get reservations for a sauna on a specific date
 */
export async function GET(request: NextRequest) {
  try {
    const club = await requireClubAuth();

    const saunaId = getQueryParam(request, 'saunaId');
    const dateStr = getQueryParam(request, 'date');

    if (!saunaId) {
      return errorResponse('saunaId query parameter is required', 400);
    }

    // Check if sauna belongs to club
    const sauna = await prisma.sauna.findUnique({
      where: { id: saunaId },
      include: { island: true },
    });

    if (!sauna || sauna.island.clubId !== club.id) {
      return errorResponse('Sauna not found', 404);
    }

    // Parse date or use today
    const date = dateStr ? new Date(dateStr) : new Date();
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    // Get reservations
    const reservations = await prisma.reservation.findMany({
      where: {
        saunaId,
        startTime: {
          gte: dayStart,
          lte: dayEnd,
        },
      },
      include: {
        boat: true,
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    return successResponse(reservations);
  } catch (error) {
    return handleApiError(error);
  }
}
