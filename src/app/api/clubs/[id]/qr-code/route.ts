import { NextRequest } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import {
  successResponse,
  errorResponse,
  handleApiError,
  getPathParam,
} from '@/lib/api-utils';
import prisma from '@/lib/db';

/**
 * GET /api/clubs/[id]/qr-code
 * Generate QR code data for club access (admin only)
 *
 * Returns the data needed to generate a QR code on the client side
 * QR code contains: club secret for authentication
 */
export async function GET(_request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    await requireAdminAuth();
    const clubId = getPathParam(params, 'id');

    const club = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!club) {
      return errorResponse('Club not found', 404);
    }

    // QR code data format
    // Option 1: Just the secret (simple)
    // Option 2: JSON with club info (more flexible)
    const qrData = {
      type: 'club_access',
      clubId: club.id,
      clubName: club.name,
      secret: club.secret,
      validFrom: club.secretValidFrom.toISOString(),
      validUntil: club.secretValidUntil.toISOString(),
      // App URL for direct link
      appUrl: `${process.env.NEXT_PUBLIC_APP_URL}/auth?secret=${club.secret}`,
    };

    return successResponse({
      club: {
        id: club.id,
        name: club.name,
      },
      qrData,
      // String to encode in QR code
      qrString: JSON.stringify(qrData),
      // Alternative: Direct URL that auto-authenticates
      directUrl: qrData.appUrl,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
