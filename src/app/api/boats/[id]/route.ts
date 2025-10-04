import { NextRequest } from 'next/server';
import { requireAdminAuth, requireClubAuth, getAdminFromSession } from '@/lib/auth';
import { parseRequestBody, successResponse, errorResponse, handleApiError, getPathParam } from '@/lib/api-utils';
import prisma from '@/lib/db';

/**
 * GET /api/boats/[id]
 * Get a specific boat
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const boatId = getPathParam(params, 'id');

    // Check if user is admin or has club access
    const admin = await getAdminFromSession();

    if (admin) {
      // Admin can access any boat
      const boat = await prisma.boat.findUnique({
        where: { id: boatId },
        include: {
          club: true,
        },
      });

      if (!boat) {
        return errorResponse('Boat not found', 404);
      }

      return successResponse(boat);
    } else {
      // Not admin, try club auth
      const club = await requireClubAuth();
      const boat = await prisma.boat.findUnique({
        where: { id: boatId },
        include: {
          club: true,
        },
      });

      if (!boat) {
        return errorResponse('Boat not found', 404);
      }

      // Verify boat belongs to authenticated club
      if (boat.clubId !== club.id) {
        return errorResponse('Access denied', 403);
      }

      return successResponse(boat);
    }
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/boats/[id]
 * Update a boat (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminAuth();
    const boatId = getPathParam(params, 'id');
    const body = await parseRequestBody(request) as {
      name?: string;
      membershipNumber?: string;
      captainName?: string;
      phoneNumber?: string;
    };
    
    const existing = await prisma.boat.findUnique({
      where: { id: boatId },
    });
    
    if (!existing) {
      return errorResponse('Boat not found', 404);
    }
    
    // If updating membership number, check for duplicates
    if (body.membershipNumber && body.membershipNumber !== existing.membershipNumber) {
      const duplicate = await prisma.boat.findFirst({
        where: {
          clubId: existing.clubId,
          membershipNumber: body.membershipNumber,
          id: { not: boatId },
        },
      });
      
      if (duplicate) {
        return errorResponse('A boat with this membership number already exists', 409);
      }
    }
    
    const updated = await prisma.boat.update({
      where: { id: boatId },
      data: {
        name: body.name,
        membershipNumber: body.membershipNumber,
        captainName: body.captainName,
        phoneNumber: body.phoneNumber,
      },
    });
    
    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/boats/[id]
 * Delete a boat (admin only)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminAuth();
    const boatId = getPathParam(params, 'id');
    
    const existing = await prisma.boat.findUnique({
      where: { id: boatId },
    });
    
    if (!existing) {
      return errorResponse('Boat not found', 404);
    }
    
    await prisma.boat.delete({
      where: { id: boatId },
    });
    
    return successResponse({ message: 'Boat deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}