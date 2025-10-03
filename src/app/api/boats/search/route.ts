import { NextRequest } from 'next/server';
import { requireClubAuth } from '@/lib/auth';
import { successResponse, errorResponse, handleApiError, getQueryParam } from '@/lib/api-utils';
import { sanitizeSearchQuery } from '@/lib/validation';
import prisma from '@/lib/db';
import type { BoatSearchResult } from '@/types';

/**
 * GET /api/boats/search?q=xxx
 * Search boats by name or membership number
 * Priority: Boat name (fuzzy) > Membership number (exact/partial)
 */
export async function GET(request: NextRequest) {
  try {
    const club = await requireClubAuth();
    const query = getQueryParam(request, 'q');
    
    if (!query) {
      return errorResponse('Search query (q) is required', 400);
    }
    
    const sanitizedQuery = sanitizeSearchQuery(query);
    
    // Get all boats for the club
    const boats = await prisma.boat.findMany({
      where: {
        clubId: club.id,
      },
    });
    
    // Score and filter boats
    const results: BoatSearchResult[] = [];
    
    for (const boat of boats) {
      let matchScore = 0;
      let matchType: 'name' | 'membership' | null = null;
      
      const boatName = boat.name.toLowerCase();
      const membershipNumber = boat.membershipNumber.toLowerCase();
      
      // Exact name match (highest priority)
      if (boatName === sanitizedQuery) {
        matchScore = 100;
        matchType = 'name';
      }
      // Name starts with query
      else if (boatName.startsWith(sanitizedQuery)) {
        matchScore = 90;
        matchType = 'name';
      }
      // Name contains query
      else if (boatName.includes(sanitizedQuery)) {
        matchScore = 70;
        matchType = 'name';
      }
      // Exact membership number match
      else if (membershipNumber === sanitizedQuery) {
        matchScore = 85;
        matchType = 'membership';
      }
      // Membership number starts with query
      else if (membershipNumber.startsWith(sanitizedQuery)) {
        matchScore = 75;
        matchType = 'membership';
      }
      // Membership number contains query
      else if (membershipNumber.includes(sanitizedQuery)) {
        matchScore = 60;
        matchType = 'membership';
      }
      
      if (matchType) {
        results.push({
          id: boat.id,
          name: boat.name,
          membershipNumber: boat.membershipNumber,
          captainName: boat.captainName,
          phoneNumber: boat.phoneNumber,
          matchType,
          matchScore,
        });
      }
    }
    
    // Sort by match score (descending) and then by name
    results.sort((a, b) => {
      if (b.matchScore !== a.matchScore) {
        return b.matchScore - a.matchScore;
      }
      return a.name.localeCompare(b.name);
    });
    
    // Limit to top 20 results
    const limitedResults = results.slice(0, 20);
    
    return successResponse(limitedResults);
  } catch (error) {
    return handleApiError(error);
  }
}