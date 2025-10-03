import { NextRequest } from 'next/server';
import { requireClubAuth } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError, getPathParam } from '@/lib/api-utils';
import { calculateNextAvailable, getCurrentReservation, getFutureReservations } from '@/lib/availability';
import prisma from '@/lib/db';
import { startOfDay, endOfDay } from 'date-fns';

/**
 * GET /api/saunas/[id]/next-available
 * Get the next available time slot for a sauna
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const club = await requireClubAuth();
    const saunaId = getPathParam(params, 'id');
    
    // Get sauna
    const sauna = await prisma.sauna.findUnique({
      where: { id: saunaId },
      include: {
        island: true,
      },
    });
    
    if (!sauna || sauna.island.clubId !== club.id) {
      return errorResponse('Sauna not found', 404);
    }
    
    // Get all active reservations for today and future
    const now = new Date();
    const todayStart = startOfDay(now);
    
    const reservations = await prisma.reservation.findMany({
      where: {
        saunaId,
        status: 'ACTIVE',
        startTime: {
          gte: todayStart,
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });
    
    // Get current reservation
    const currentReservation = getCurrentReservation(reservations, now);
    
    // Get future reservations
    const futureReservations = getFutureReservations(reservations, now);
    
    // Calculate next available
    const nextAvailable = calculateNextAvailable(
      sauna,
      currentReservation,
      futureReservations,
      now
    );
    
    // Check for shared reservations today
    const todayEnd = endOfDay(now);
    const sharedReservations = await prisma.sharedReservation.findMany({
      where: {
        saunaId,
        date: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
      include: {
        participants: {
          include: {
            boat: true,
          },
        },
      },
    });
    
    return successResponse({
      sauna: {
        id: sauna.id,
        name: sauna.name,
        heatingTimeHours: sauna.heatingTimeHours,
      },
      isCurrentlyReserved: !!currentReservation,
      currentReservation,
      nextAvailable,
      sharedReservationsToday: sharedReservations,
    });
  } catch (error) {
    return handleApiError(error);
  }
}