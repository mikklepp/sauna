import { NextRequest } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError, getPathParam, getQueryParam } from '@/lib/api-utils';
import prisma from '@/lib/db';
import { startOfYear, endOfYear } from 'date-fns';
import type { BoatAnnualReport } from '@/types';

/**
 * GET /api/reports/boat/[id]?year=2024
 * Get annual report for a boat
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdminAuth();
    const boatId = getPathParam(params, 'id');
    const yearParam = getQueryParam(request, 'year');
    const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();
    
    // Verify boat exists
    const boat = await prisma.boat.findUnique({
      where: { id: boatId },
    });
    
    if (!boat) {
      return errorResponse('Boat not found', 404);
    }
    
    const yearStart = startOfYear(new Date(year, 0, 1));
    const yearEnd = endOfYear(new Date(year, 11, 31));
    
    // Get individual reservations
    const individualReservations = await prisma.reservation.findMany({
      where: {
        boatId,
        status: {
          in: ['ACTIVE', 'COMPLETED'],
        },
        startTime: {
          gte: yearStart,
          lte: yearEnd,
        },
      },
      include: {
        sauna: {
          include: {
            island: true,
          },
        },
      },
    });
    
    // Get shared reservation participations
    const sharedParticipations = await prisma.sharedReservationParticipant.findMany({
      where: {
        boatId,
        sharedReservation: {
          date: {
            gte: yearStart,
            lte: yearEnd,
          },
        },
      },
      include: {
        sharedReservation: {
          include: {
            sauna: {
              include: {
                island: true,
              },
            },
          },
        },
      },
    });
    
    // Calculate metrics
    const totalIndividualReservations = individualReservations.length;
    const totalHoursReserved = totalIndividualReservations; // 1 hour each
    
    const sharedAdults = sharedParticipations.reduce((sum, p) => sum + p.adults, 0);
    const sharedKids = sharedParticipations.reduce((sum, p) => sum + p.kids, 0);
    
    // Per island breakdown
    const perIslandData: { [islandId: string]: { islandName: string; individual: number; shared: number } } = {};
    
    individualReservations.forEach(r => {
      const islandId = r.sauna.islandId;
      if (!perIslandData[islandId]) {
        perIslandData[islandId] = {
          islandName: r.sauna.island.name,
          individual: 0,
          shared: 0,
        };
      }
      perIslandData[islandId].individual++;
    });
    
    sharedParticipations.forEach(p => {
      const islandId = p.sharedReservation.sauna.islandId;
      if (!perIslandData[islandId]) {
        perIslandData[islandId] = {
          islandName: p.sharedReservation.sauna.island.name,
          individual: 0,
          shared: 0,
        };
      }
      perIslandData[islandId].shared++;
    });
    
    const report: BoatAnnualReport = {
      boatId,
      boatName: boat.name,
      membershipNumber: boat.membershipNumber,
      year,
      
      // Individual (for invoicing)
      totalIndividualReservations,
      totalHoursReserved,
      
      // Shared (not for invoicing)
      totalSharedParticipations: sharedParticipations.length,
      sharedAdults,
      sharedKids,
      
      // Per island
      perIslandData: Object.entries(perIslandData).map(([islandId, data]) => ({
        islandId,
        islandName: data.islandName,
        individualReservations: data.individual,
        sharedParticipations: data.shared,
      })),
    };
    
    return successResponse(report);
  } catch (error) {
    return handleApiError(error);
  }
}