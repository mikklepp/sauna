import { NextRequest } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { generateClubSecret } from '@/lib/auth';
import { parseRequestBody, successResponse, handleApiError } from '@/lib/api-utils';
import { createClubSchema } from '@/lib/validation';
import prisma from '@/lib/db';
import { addYears } from 'date-fns';

/**
 * POST /api/clubs
 * Create a new club (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdminAuth();
    const body = await parseRequestBody(request);
    
    // Validate input
    const validated = createClubSchema.parse(body);
    
    // Generate club secret
    const secret = generateClubSecret();
    const now = new Date();
    const validFrom = now;
    const validUntil = addYears(now, 1);
    
    // Create club
    const club = await prisma.club.create({
      data: {
        name: validated.name,
        secret,
        secretValidFrom: validFrom,
        secretValidUntil: validUntil,
        logoUrl: validated.logoUrl,
        primaryColor: validated.primaryColor,
        secondaryColor: validated.secondaryColor,
        timezone: validated.timezone,
      },
    });
    
    return successResponse(club, 201);
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/clubs
 * Get all clubs (admin only)
 */
export async function GET() {
  try {
    await requireAdminAuth();
    
    const clubs = await prisma.club.findMany({
      include: {
        islands: true,
        boats: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
    
    return successResponse(clubs);
  } catch (error) {
    return handleApiError(error);
  }
}