import { NextRequest } from 'next/server';
import {
  requireAdminAuth,
  requireClubAuth,
  getAdminFromSession,
} from '@/lib/auth';
import {
  parseRequestBody,
  successResponse,
  errorResponse,
  handleApiError,
  getPathParam,
} from '@/lib/api-utils';
import prisma from '@/lib/db';

/**
 * GET /api/saunas/[id]
 * Get a specific sauna
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const saunaId = getPathParam(params, 'id');

    // Check if user is admin or has club access
    const admin = await getAdminFromSession();

    if (admin) {
      // Admin can access any sauna
      const sauna = await prisma.sauna.findUnique({
        where: { id: saunaId },
        include: {
          island: {
            include: {
              club: true,
            },
          },
        },
      });

      if (!sauna) {
        return errorResponse('Sauna not found', 404);
      }

      return successResponse(sauna);
    } else {
      // Not admin, try club auth
      const club = await requireClubAuth();
      const sauna = await prisma.sauna.findUnique({
        where: { id: saunaId },
        include: {
          island: {
            include: {
              club: true,
            },
          },
        },
      });

      if (!sauna) {
        return errorResponse('Sauna not found', 404);
      }

      // Verify sauna belongs to authenticated club
      if (sauna.island.clubId !== club.id) {
        return errorResponse('Access denied', 403);
      }

      return successResponse(sauna);
    }
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/saunas/[id]
 * Update a sauna (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminAuth();
    const saunaId = getPathParam(params, 'id');
    const body = (await parseRequestBody(request)) as {
      name?: string;
      heatingTimeHours?: number;
      autoClubSaunaEnabled?: boolean;
    };

    const existing = await prisma.sauna.findUnique({
      where: { id: saunaId },
    });

    if (!existing) {
      return errorResponse('Sauna not found', 404);
    }

    const updated = await prisma.sauna.update({
      where: { id: saunaId },
      data: {
        name: body.name,
        heatingTimeHours: body.heatingTimeHours,
        autoClubSaunaEnabled: body.autoClubSaunaEnabled,
      },
      include: {
        island: {
          include: {
            club: true,
          },
        },
      },
    });

    return successResponse(updated);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * DELETE /api/saunas/[id]
 * Delete a sauna (admin only)
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminAuth();
    const saunaId = getPathParam(params, 'id');

    const existing = await prisma.sauna.findUnique({
      where: { id: saunaId },
    });

    if (!existing) {
      return errorResponse('Sauna not found', 404);
    }

    await prisma.sauna.delete({
      where: { id: saunaId },
    });

    return successResponse({ message: 'Sauna deleted successfully' });
  } catch (error) {
    return handleApiError(error);
  }
}
