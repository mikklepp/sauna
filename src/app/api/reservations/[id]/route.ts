import { NextRequest } from 'next/server';
import { requireClubAuth } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError, getPathParam } from '@/lib/api-utils';
import { canCancelReservation } from '@/lib/availability';
import prisma from '@/lib/db';

/**
 * GET /api/reservations/[id]
 * Get a specific reservation
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const club = await requireClubAuth();
    const id = getPathParam(params, 'id');
    
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        sauna: {
          include: {
            island: true,
          },
        },
        boat: true,
      },
    });
    
    if (!reservation) {
      return errorResponse('Reservation not found', 404);
    }
    
    // Check if belongs to club
    if (reservation.sauna.island.clubId !== club.id) {
      return errorResponse('Reservation not found', 404);
    }
    
    return successResponse(reservation);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/reservations/[id]
 * Cancel a reservation
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const club = await requireClubAuth();
    const id = getPathParam(params, 'id');
    
    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        sauna: {
          include: {
            island: true,
          },
        },
      },
    });
    
    if (!reservation) {
      return errorResponse('Reservation not found', 404);
    }
    
    // Check if belongs to club
    if (reservation.sauna.island.clubId !== club.id) {
      return errorResponse('Reservation not found', 404);
    }
    
    // Check if can be cancelled
    const cancellationCheck = canCancelReservation(reservation);
    
    if (!cancellationCheck.canCancel) {
      if (cancellationCheck.reason === 'too_late') {
        return errorResponse(
          'Cannot cancel - less than 15 minutes before start time',
          400
        );
      }
      if (cancellationCheck.reason === 'already_started') {
        return errorResponse('Cannot cancel - reservation has already started', 400);
      }
      if (cancellationCheck.reason === 'already_cancelled') {
        return errorResponse('Reservation is already cancelled', 400);
      }
      return errorResponse('Cannot cancel this reservation', 400);
    }
    
    // Cancel the reservation
    const cancelled = await prisma.reservation.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
      },
      include: {
        sauna: true,
        boat: true,
      },
    });
    
    return successResponse(cancelled);
  } catch (error) {
    return handleApiError(error);
  }
}