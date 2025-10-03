import { NextRequest } from 'next/server';
import { requireClubAuth } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError, getPathParam } from '@/lib/api-utils';
import prisma from '@/lib/db';

/**
 * GET /api/clubs/[id]/config
 * Get complete club configuration (islands, saunas, boats)
 * Used for Island Device initialization and user app setup
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authenticatedClub = await requireClubAuth();
    const clubId = getPathParam(params, 'id');
    
    // Verify requesting the right club
    if (authenticatedClub.id !== clubId) {
      return errorResponse('Access denied', 403);
    }
    
    // Get complete club configuration
    const club = await prisma.club.findUnique({
      where: { id: clubId },
      include: {
        islands: {
          include: {
            saunas: {
              orderBy: {
                name: 'asc',
              },
            },
          },
          orderBy: {
            name: 'asc',
          },
        },
        boats: {
          orderBy: {
            name: 'asc',
          },
        },
      },
    });
    
    if (!club) {
      return errorResponse('Club not found', 404);
    }
    
    // Format response for easy consumption
    const config = {
      club: {
        id: club.id,
        name: club.name,
        logoUrl: club.logoUrl,
        primaryColor: club.primaryColor,
        secondaryColor: club.secondaryColor,
        timezone: club.timezone,
      },
      islands: club.islands.map(island => ({
        id: island.id,
        name: island.name,
        numberOfSaunas: island.numberOfSaunas,
        saunas: island.saunas.map(sauna => ({
          id: sauna.id,
          name: sauna.name,
          heatingTimeHours: sauna.heatingTimeHours,
          autoClubSaunaEnabled: sauna.autoClubSaunaEnabled,
        })),
      })),
      boats: club.boats.map(boat => ({
        id: boat.id,
        name: boat.name,
        membershipNumber: boat.membershipNumber,
        captainName: boat.captainName,
        phoneNumber: boat.phoneNumber,
      })),
    };
    
    return successResponse(config);
  } catch (error) {
    return handleApiError(error);
  }
}