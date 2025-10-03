import { NextRequest } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import { parseRequestBody, successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { validateCSVBoatRow } from '@/lib/validation';
import prisma from '@/lib/db';

/**
 * POST /api/boats/bulk-import
 * Bulk import boats from CSV data (admin only)
 * 
 * Expected CSV format:
 * name,membershipNumber,captainName,phoneNumber
 * Sea Spirit,HSC-001,Matti Virtanen,+358 40 123 4567
 * Wave Dancer,HSC-002,Liisa Korhonen,+358 50 234 5678
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdminAuth();
    const body = await parseRequestBody<{
      clubId: string;
      boats: Array<{
        name: string;
        membershipNumber: string;
        captainName?: string;
        phoneNumber?: string;
      }>;
    }>(request);
    
    if (!body.clubId) {
      return errorResponse('clubId is required', 400);
    }
    
    if (!Array.isArray(body.boats) || body.boats.length === 0) {
      return errorResponse('boats array is required and must not be empty', 400);
    }
    
    // Verify club exists
    const club = await prisma.club.findUnique({
      where: { id: body.clubId },
    });
    
    if (!club) {
      return errorResponse('Club not found', 404);
    }
    
    // Validate all boat data first
    const validatedBoats = [];
    const errors = [];
    
    for (let i = 0; i < body.boats.length; i++) {
      const validation = validateCSVBoatRow(body.boats[i], i + 1);
      
      if (!validation.valid) {
        errors.push(validation.error);
      } else if (validation.data) {
        validatedBoats.push(validation.data);
      }
    }
    
    if (errors.length > 0) {
      return errorResponse(
        `Validation errors:\n${errors.join('\n')}`,
        400
      );
    }
    
    // Check for duplicate membership numbers in the import
    const membershipNumbers = validatedBoats.map(b => b.membershipNumber);
    const duplicatesInImport = membershipNumbers.filter(
      (num, index) => membershipNumbers.indexOf(num) !== index
    );
    
    if (duplicatesInImport.length > 0) {
      return errorResponse(
        `Duplicate membership numbers in import: ${duplicatesInImport.join(', ')}`,
        400
      );
    }
    
    // Check for existing membership numbers in database
    const existingBoats = await prisma.boat.findMany({
      where: {
        clubId: body.clubId,
        membershipNumber: {
          in: membershipNumbers,
        },
      },
    });
    
    if (existingBoats.length > 0) {
      const existingNumbers = existingBoats.map(b => b.membershipNumber);
      return errorResponse(
        `The following membership numbers already exist: ${existingNumbers.join(', ')}`,
        409
      );
    }
    
    // Perform bulk insert
    const created = await prisma.$transaction(
      validatedBoats.map(boat =>
        prisma.boat.create({
          data: {
            ...boat,
            clubId: body.clubId,
          },
        })
      )
    );
    
    return successResponse({
      message: `Successfully imported ${created.length} boats`,
      imported: created.length,
      boats: created,
    }, 201);
  } catch (error) {
    return handleApiError(error);
  }
}