import { NextRequest } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  handleApiError,
  getPathParam,
} from '@/lib/api-utils';
import prisma from '@/lib/db';

/**
 * DELETE /api/shared-reservations/[id]
 * Delete a shared reservation (admin only)
 * Cascade deletes all participants
 */
export async function DELETE(
  _request: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  const params = await props.params;
  try {
    await requireAdminAuth();
    const sharedReservationId = getPathParam(params, 'id');

    // Check if shared reservation exists
    const existing = await prisma.sharedReservation.findUnique({
      where: { id: sharedReservationId },
      include: {
        _count: {
          select: {
            participants: true,
          },
        },
      },
    });

    if (!existing) {
      return errorResponse('Shared reservation not found', 404);
    }

    // Delete shared reservation (cascade will delete participants)
    await prisma.sharedReservation.delete({
      where: { id: sharedReservationId },
    });

    return successResponse({
      message: 'Shared reservation deleted successfully',
      participantsDeleted: existing._count.participants,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
