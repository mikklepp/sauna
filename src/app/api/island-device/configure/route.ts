import { NextRequest } from 'next/server';
import {
  parseRequestBody,
  successResponse,
  errorResponse,
  handleApiError,
} from '@/lib/api-utils';
import prisma from '@/lib/db';

/**
 * POST /api/island-device/configure
 * Configure an island device with a valid device token
 * Returns full configuration data needed for offline operation
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await parseRequestBody(request)) as {
      token?: string;
    };
    const { token } = body;

    if (!token || typeof token !== 'string') {
      return errorResponse('Device token is required', 400);
    }

    // Find device by token
    const device = await prisma.islandDevice.findUnique({
      where: { deviceToken: token },
      include: {
        island: {
          include: {
            club: true,
            saunas: {
              orderBy: { name: 'asc' },
            },
          },
        },
      },
    });

    if (!device) {
      return errorResponse('Invalid device token', 401);
    }

    // Get all boats for the club
    const boats = await prisma.boat.findMany({
      where: { clubId: device.island.club.id },
      orderBy: { membershipNumber: 'asc' },
    });

    // Mark device as configured
    await prisma.islandDevice.update({
      where: { id: device.id },
      data: { isConfigured: true },
    });

    // Return configuration data
    return successResponse({
      deviceId: device.id,
      club: {
        id: device.island.club.id,
        name: device.island.club.name,
        secret: device.island.club.secret,
        logoUrl: device.island.club.logoUrl,
        primaryColor: device.island.club.primaryColor,
        secondaryColor: device.island.club.secondaryColor,
        timezone: device.island.club.timezone,
      },
      island: {
        id: device.island.id,
        name: device.island.name,
        clubId: device.island.clubId,
        numberOfSaunas: device.island.numberOfSaunas,
      },
      saunas: device.island.saunas.map((sauna) => ({
        id: sauna.id,
        name: sauna.name,
        islandId: sauna.islandId,
        heatingTimeHours: sauna.heatingTimeHours,
        autoClubSaunaEnabled: sauna.autoClubSaunaEnabled,
      })),
      boats: boats.map((boat) => ({
        id: boat.id,
        name: boat.name,
        clubId: boat.clubId,
        membershipNumber: boat.membershipNumber,
        captainName: boat.captainName,
        phoneNumber: boat.phoneNumber,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
