import { NextRequest } from 'next/server';
import { validateCronSecret } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  handleApiError,
  getAuthHeader,
} from '@/lib/api-utils';
import { renewClubSecrets, getClubsNeedingRenewal } from '@/lib/secret-renewal';

/**
 * POST /api/cron/renew-club-secrets
 * Automatically renew club secrets that are expired or expiring within 30 days
 * Runs daily at 00:00 UTC
 */
export async function POST(request: NextRequest) {
  try {
    // Validate cron secret
    const authHeader = getAuthHeader(request);
    const secret = authHeader?.replace('Bearer ', '');

    if (!validateCronSecret(secret || '')) {
      return errorResponse('Unauthorized', 401);
    }

    // Perform renewal
    const renewalResults = await renewClubSecrets();

    if (renewalResults.length === 0) {
      return successResponse({
        message: 'No club secrets need renewal at this time',
        renewed: [],
      });
    }

    // Format results for response (without exposing secrets)
    const renewedClubs = renewalResults.map((result) => ({
      clubId: result.clubId,
      clubName: result.clubName,
      newExpiry: result.newExpiry.toISOString(),
      wasExpired: result.wasExpired,
    }));

    // Log full details to server console (with secrets for admin access)
    // eslint-disable-next-line no-console
    console.log('\n' + '='.repeat(80));
    // eslint-disable-next-line no-console
    console.log('🔐 CLUB SECRET RENEWAL SUMMARY');
    // eslint-disable-next-line no-console
    console.log('='.repeat(80));
    for (const result of renewalResults) {
      // eslint-disable-next-line no-console
      console.log(
        `\n📋 Club: ${result.clubName}\n` +
          `   Status: ${result.wasExpired ? '❌ EXPIRED' : '⚠️  Expiring Soon'}\n` +
          `   Old Secret: ${result.oldSecret}\n` +
          `   New Secret: ${result.newSecret}\n` +
          `   Old Expiry: ${result.oldExpiry.toISOString()}\n` +
          `   New Expiry: ${result.newExpiry.toISOString()}`
      );
    }
    // eslint-disable-next-line no-console
    console.log('\n' + '='.repeat(80) + '\n');

    return successResponse({
      message: `Successfully renewed ${renewalResults.length} club secret(s)`,
      renewed: renewedClubs,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/cron/renew-club-secrets
 * Check which clubs need renewal (without actually renewing)
 */
export async function GET(request: NextRequest) {
  try {
    // Validate cron secret
    const authHeader = getAuthHeader(request);
    const secret = authHeader?.replace('Bearer ', '');

    if (!validateCronSecret(secret || '')) {
      return errorResponse('Unauthorized', 401);
    }

    const clubsNeedingRenewal = await getClubsNeedingRenewal();

    return successResponse({
      message: 'Club secret renewal status',
      needingRenewal: clubsNeedingRenewal.map((club) => ({
        clubId: club.id,
        clubName: club.name,
        currentExpiry: club.secretValidUntil.toISOString(),
        daysUntilExpiry: club.daysUntilExpiry,
        isExpired: club.isExpired,
      })),
      count: clubsNeedingRenewal.length,
      schedule: 'Runs daily at 00:00 UTC',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
