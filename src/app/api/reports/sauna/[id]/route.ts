import { NextRequest } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  handleApiError,
  getPathParam,
  getQueryParam,
} from '@/lib/api-utils';
import prisma from '@/lib/db';
import { startOfYear, endOfYear } from 'date-fns';
import type { SaunaAnnualReport } from '@/types';

/**
 * GET /api/reports/sauna/[id]?year=2024
 * Get annual report for a sauna
 */
export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    await requireAdminAuth();
    const saunaId = getPathParam(params, 'id');
    const yearParam = getQueryParam(request, 'year');
    const year = yearParam ? parseInt(yearParam) : new Date().getFullYear();

    // Verify sauna exists
    const sauna = await prisma.sauna.findUnique({
      where: { id: saunaId },
    });

    if (!sauna) {
      return errorResponse('Sauna not found', 404);
    }

    const yearStart = startOfYear(new Date(year, 0, 1));
    const yearEnd = endOfYear(new Date(year, 11, 31));

    // Get individual reservations (for invoicing)
    const individualReservations = await prisma.reservation.findMany({
      where: {
        saunaId,
        status: {
          in: ['ACTIVE', 'COMPLETED'],
        },
        startTime: {
          gte: yearStart,
          lte: yearEnd,
        },
      },
      include: {
        boat: true,
      },
    });

    // Get shared reservations
    const sharedReservations = await prisma.sharedReservation.findMany({
      where: {
        saunaId,
        date: {
          gte: yearStart,
          lte: yearEnd,
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

    // Calculate metrics
    const totalHoursReserved = individualReservations.length; // 1 hour each
    const individualAdults = individualReservations.reduce(
      (sum, r) => sum + r.adults,
      0
    );
    const individualKids = individualReservations.reduce(
      (sum, r) => sum + r.kids,
      0
    );

    let sharedAdults = 0;
    let sharedKids = 0;
    sharedReservations.forEach((sr) => {
      sr.participants.forEach((p) => {
        sharedAdults += p.adults;
        sharedKids += p.kids;
      });
    });

    // Unique boats
    const individualBoatIds = new Set(
      individualReservations.map((r) => r.boatId)
    );
    const sharedBoatIds = new Set<string>();
    sharedReservations.forEach((sr) => {
      sr.participants.forEach((p) => sharedBoatIds.add(p.boatId));
    });

    const allBoatIds = new Set([...individualBoatIds, ...sharedBoatIds]);
    const boatsInBoth = new Set(
      [...individualBoatIds].filter((id) => sharedBoatIds.has(id))
    );

    const report: SaunaAnnualReport = {
      saunaId,
      saunaName: sauna.name,
      year,

      // Individual (for invoicing)
      totalHoursReserved,
      totalIndividualReservations: individualReservations.length,

      // Party size breakdown
      individualAdults,
      individualKids,
      sharedAdults,
      sharedKids,
      totalAdults: individualAdults + sharedAdults,
      totalKids: individualKids + sharedKids,

      // Unique boats
      uniqueBoatsTotal: allBoatIds.size,
      uniqueBoatsIndividual: individualBoatIds.size,
      uniqueBoatsShared: sharedBoatIds.size,
      uniqueBoatsBoth: boatsInBoth.size,
    };

    return successResponse(report);
  } catch (error) {
    return handleApiError(error);
  }
}
