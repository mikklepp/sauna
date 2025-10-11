import { getClubFromSession } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  handleApiError,
} from '@/lib/api-utils';

/**
 * GET /api/auth/session
 * Get current session information
 */
export async function GET() {
  try {
    const club = await getClubFromSession();

    if (!club) {
      return errorResponse('No active session', 401);
    }

    return successResponse({
      club: {
        id: club.id,
        name: club.name,
        timezone: club.timezone,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
