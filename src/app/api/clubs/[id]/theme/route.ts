import { NextRequest } from 'next/server';
import { requireAdminAuth } from '@/lib/auth';
import {
  parseRequestBody,
  successResponse,
  errorResponse,
  handleApiError,
  getPathParam,
} from '@/lib/api-utils';
import { updateClubThemeSchema } from '@/lib/validation';
import prisma from '@/lib/db';

/**
 * POST /api/clubs/[id]/theme
 * Update club theme (logo, colors) - admin only
 */
export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    await requireAdminAuth();
    const clubId = getPathParam(params, 'id');
    const body = await parseRequestBody(request);

    // Validate input
    const validated = updateClubThemeSchema.parse(body);

    // Check if club exists
    const existing = await prisma.club.findUnique({
      where: { id: clubId },
    });

    if (!existing) {
      return errorResponse('Club not found', 404);
    }

    // Update theme
    const updated = await prisma.club.update({
      where: { id: clubId },
      data: {
        logoUrl: validated.logoUrl ?? existing.logoUrl,
        primaryColor: validated.primaryColor ?? existing.primaryColor,
        secondaryColor: validated.secondaryColor ?? existing.secondaryColor,
      },
    });

    return successResponse({
      id: updated.id,
      name: updated.name,
      logoUrl: updated.logoUrl,
      primaryColor: updated.primaryColor,
      secondaryColor: updated.secondaryColor,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
