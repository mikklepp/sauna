import { NextRequest } from 'next/server';
import { validateClubSecret, setClubSessionCookie } from '@/lib/auth';
import { parseRequestBody, successResponse, errorResponse, handleApiError } from '@/lib/api-utils';
import { validateClubSecretSchema } from '@/lib/validation';

/**
 * POST /api/auth/validate-club-secret
 * Validate a club secret and create session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await parseRequestBody<{ secret: string }>(request);
    
    // Validate input
    const validated = validateClubSecretSchema.parse(body);
    
    // Validate club secret
    const result = await validateClubSecret(validated.secret);
    
    if (!result.valid || !result.club) {
      return errorResponse(result.error || 'Invalid club secret', 401);
    }
    
    // Create session
    await setClubSessionCookie(result.club.id);
    
    return successResponse({
      valid: true,
      clubId: result.club.id,
      clubName: result.club.name,
      expiresAt: result.club.secretValidUntil,
    });
  } catch (error) {
    return handleApiError(error);
  }
}