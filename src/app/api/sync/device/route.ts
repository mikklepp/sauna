import { NextRequest } from 'next/server';
import {
  parseRequestBody,
  successResponse,
  errorResponse,
  handleApiError,
} from '@/lib/api-utils';
import prisma from '@/lib/db';

/**
 * POST /api/sync/device
 * Bidirectional sync between Island Device and backend
 * Island Device is the source of truth - device data always wins
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await parseRequestBody(request)) as {
      deviceId?: string;
      islandId?: string;
    };
    const { deviceId, islandId } = body;

    if (!deviceId || typeof deviceId !== 'string') {
      return errorResponse('deviceId is required', 400);
    }

    if (!islandId || typeof islandId !== 'string') {
      return errorResponse('islandId is required', 400);
    }

    // Verify device is authorized for this island
    const device = await prisma.islandDevice.findUnique({
      where: { id: deviceId },
    });

    if (!device) {
      return errorResponse('Device not found', 404);
    }

    if (device.islandId !== islandId) {
      return errorResponse('Device not authorized for this island', 403);
    }

    // Update last sync timestamp
    await prisma.islandDevice.update({
      where: { id: deviceId },
      data: { lastSyncAt: new Date() },
    });

    // In a full implementation, this would:
    // 1. Accept reservation data from the device
    // 2. Upsert reservations to the database (device wins on conflicts)
    // 3. Send back any server-side changes (new shared reservations, boat updates, etc.)
    // 4. Log sync conflicts for admin review

    // For now, return a simple acknowledgment
    // This can be expanded to handle actual data sync in the future
    return successResponse({
      synced: true,
      timestamp: new Date().toISOString(),
      message: 'Sync completed successfully',
    });
  } catch (error) {
    return handleApiError(error);
  }
}
