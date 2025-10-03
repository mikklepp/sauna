import { NextRequest } from 'next/server';
import { requireAdminAuth, requireClubAuth } from '@/lib/auth';
import { parseRequestBody, successResponse, errorResponse, handleApiError, getPathParam } from '@/lib/api-utils';
import prisma from '@/lib/db';

/**
 * GET /api/islands/[id]
 * Get a specific island
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const club = await requireClubAuth();
    const islandId = getPathParam(params, 'id');
    
    const island = await prisma.island.findUnique({
      where: { id: islandId },
      include: {
        club: true,
        saunas: true,
      },
    });
    
    if (!island) {
      return errorResponse('Island not found', 404);
    }
    
    // Verify island belongs to authenticated club
    if (island.clubId !== club.id) {
      return errorResponse('Access denied', 403);
    }
    
    return successResponse(island);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/islands/[id]
 * Update an island (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminAuth();
    const islandId = getPathParam(params, 'id');
    const body = await parseRequestBody(request);
    
    const existing = await prisma.island.findUnique({
      where: { id: islandId },
    });
    
    if (!existing) {
      return errorResponse('Island not found', 404);
    }
    
    const updated = await prisma.island.update({
      where: { id: islandId },
      data: {
        name: body.name,
        numberOfSaunas: body.numberOfSaunas,
      },
      include: {
        club: true,
        saunas: true,
      },
    });
    
    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/islands/[id]
 * Delete an island (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminAuth();
    const islandId = getPathParam(params, 'id');
    
    const existing = await prisma.island.findUnique({
      where: { id: islandId },
    });
    
    if (!existing) {
      return errorResponse('Island not found', 404);
    }
    
    await prisma.island.delete({
      where: { id: islandId },
    });
    
    return successResponse({ message: 'Island deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}