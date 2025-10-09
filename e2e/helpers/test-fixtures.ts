/**
 * Test Fixtures
 *
 * Provides a known, consistent test data setup for E2E tests.
 * All tests should use these fixtures to ensure repeatable test runs.
 *
 * The test club data is reset before each test run to ensure a clean state.
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Test Club Configuration
 * Inspired by the seed data but with predictable values for testing
 */
export const TEST_CLUB = {
  name: 'E2E Test Sailing Club',
  secret: 'E2E_TEST_SECRET_2024',
  secretValidFrom: new Date('2024-01-01'),
  secretValidUntil: new Date('2025-12-31'),
  logoUrl: null,
  primaryColor: '#0070f3',
  secondaryColor: '#7928ca',
  timezone: 'Europe/Helsinki',
} as const;

export const TEST_ADMIN = {
  username: 'e2e_admin',
  password: 'e2e_admin_password_123',
  name: 'E2E Test Administrator',
  email: 'e2e_admin@test.com',
} as const;

export const TEST_ISLANDS = [
  {
    name: 'Test North Island',
    numberOfSaunas: 2,
  },
  {
    name: 'Test South Island',
    numberOfSaunas: 1,
  },
] as const;

export const TEST_SAUNAS = [
  {
    islandIndex: 0, // North Island
    name: 'North Main Sauna',
    heatingTimeHours: 2,
    autoClubSaunaEnabled: true,
  },
  {
    islandIndex: 0, // North Island
    name: 'North Small Sauna',
    heatingTimeHours: 1,
    autoClubSaunaEnabled: false,
  },
  {
    islandIndex: 1, // South Island
    name: 'South Beach Sauna',
    heatingTimeHours: 3,
    autoClubSaunaEnabled: true,
  },
] as const;

export const TEST_BOATS = [
  {
    name: 'Test Alpha',
    membershipNumber: 'E2E-001',
    captainName: 'Test Captain Alpha',
    phoneNumber: '+358 40 111 1111',
  },
  {
    name: 'Test Beta',
    membershipNumber: 'E2E-002',
    captainName: 'Test Captain Beta',
    phoneNumber: '+358 40 222 2222',
  },
  {
    name: 'Test Gamma',
    membershipNumber: 'E2E-003',
    captainName: 'Test Captain Gamma',
    phoneNumber: null,
  },
  {
    name: 'Test Delta',
    membershipNumber: 'E2E-004',
    captainName: 'Test Captain Delta',
    phoneNumber: '+358 40 444 4444',
  },
  {
    name: 'Test Epsilon',
    membershipNumber: 'E2E-005',
    captainName: 'Test Captain Epsilon',
    phoneNumber: '+358 40 555 5555',
  },
  {
    name: 'Test Zeta',
    membershipNumber: 'E2E-006',
    captainName: 'Test Captain Zeta',
    phoneNumber: null,
  },
  {
    name: 'Test Eta',
    membershipNumber: 'E2E-007',
    captainName: 'Test Captain Eta',
    phoneNumber: '+358 40 777 7777',
  },
  {
    name: 'Test Theta',
    membershipNumber: 'E2E-008',
    captainName: 'Test Captain Theta',
    phoneNumber: '+358 40 888 8888',
  },
] as const;

/**
 * Reset and recreate the test club with all its data.
 * This ensures every test run starts with a known, clean state.
 */
export async function resetTestClub() {
  console.log('🧹 Resetting test club data...');

  // Find existing test club
  const existingClub = await prisma.club.findUnique({
    where: { secret: TEST_CLUB.secret },
    include: {
      islands: {
        include: {
          saunas: true,
        },
      },
      boats: true,
    },
  });

  // Delete all test club data if it exists (cascade will handle related data)
  if (existingClub) {
    console.log('  Deleting existing test club and related data...');
    await prisma.club.delete({
      where: { id: existingClub.id },
    });
  }

  // Find existing test admin
  const existingAdmin = await prisma.adminUser.findUnique({
    where: { username: TEST_ADMIN.username },
  });

  if (existingAdmin) {
    console.log('  Deleting existing test admin...');
    await prisma.adminUser.delete({
      where: { id: existingAdmin.id },
    });
  }

  console.log('  Creating fresh test admin...');
  const adminPasswordHash = await bcrypt.hash(TEST_ADMIN.password, 10);
  await prisma.adminUser.create({
    data: {
      username: TEST_ADMIN.username,
      passwordHash: adminPasswordHash,
      name: TEST_ADMIN.name,
      email: TEST_ADMIN.email,
    },
  });

  console.log('  Creating fresh test club...');
  const club = await prisma.club.create({
    data: TEST_CLUB,
  });

  console.log('  Creating test islands...');
  const islands = await Promise.all(
    TEST_ISLANDS.map((island) =>
      prisma.island.create({
        data: {
          clubId: club.id,
          name: island.name,
          numberOfSaunas: island.numberOfSaunas,
        },
      })
    )
  );

  console.log('  Creating test saunas...');
  const saunas = await Promise.all(
    TEST_SAUNAS.map((sauna) =>
      prisma.sauna.create({
        data: {
          islandId: islands[sauna.islandIndex].id,
          name: sauna.name,
          heatingTimeHours: sauna.heatingTimeHours,
          autoClubSaunaEnabled: sauna.autoClubSaunaEnabled,
        },
      })
    )
  );

  console.log('  Creating test boats...');
  const boats = await Promise.all(
    TEST_BOATS.map((boat) =>
      prisma.boat.create({
        data: {
          clubId: club.id,
          name: boat.name,
          membershipNumber: boat.membershipNumber,
          captainName: boat.captainName,
          phoneNumber: boat.phoneNumber,
        },
      })
    )
  );

  console.log('✅ Test club reset complete!');

  return {
    club,
    islands,
    saunas,
    boats,
  };
}

/**
 * Get the test club secret for authentication
 */
export function getTestClubSecret(): string {
  return TEST_CLUB.secret;
}

/**
 * Get test admin credentials
 */
export function getTestAdminCredentials() {
  return {
    username: TEST_ADMIN.username,
    password: TEST_ADMIN.password,
  };
}

/**
 * Create a test reservation for a specific scenario
 */
export async function createTestReservation(options: {
  saunaIndex: number;
  boatIndex: number;
  startTimeOffset: number; // Hours from now (negative for past, positive for future)
  durationHours?: number;
  adults?: number;
  kids?: number;
  status?: 'ACTIVE' | 'CANCELLED';
}) {
  const {
    saunaIndex,
    boatIndex,
    startTimeOffset,
    durationHours = 1,
    adults = 2,
    kids = 0,
    status = 'ACTIVE',
  } = options;

  // Get the test club data
  const club = await prisma.club.findUnique({
    where: { secret: TEST_CLUB.secret },
    include: {
      islands: {
        include: {
          saunas: true,
        },
      },
      boats: true,
    },
  });

  if (!club) {
    throw new Error('Test club not found. Run resetTestClub() first.');
  }

  const saunas = club.islands.flatMap((i) => i.saunas);
  const sauna = saunas[saunaIndex];
  const boat = club.boats[boatIndex];

  if (!sauna || !boat) {
    throw new Error('Invalid sauna or boat index');
  }

  const now = new Date();
  const startTime = new Date(now.getTime() + startTimeOffset * 60 * 60 * 1000);
  const endTime = new Date(startTime.getTime() + durationHours * 60 * 60 * 1000);

  return await prisma.reservation.create({
    data: {
      saunaId: sauna.id,
      boatId: boat.id,
      startTime,
      endTime,
      adults,
      kids,
      status,
    },
  });
}

/**
 * Create a test shared reservation
 */
export async function createTestSharedReservation(options: {
  saunaIndex: number;
  startTimeOffset: number; // Hours from now
  name?: string;
  description?: string;
  malesDurationHours?: number;
  femalesDurationHours?: number;
  genderOrder?: 'MALES_FIRST' | 'FEMALES_FIRST';
  participants?: Array<{
    boatIndex: number;
    adults: number;
    kids: number;
  }>;
}) {
  const {
    saunaIndex,
    startTimeOffset,
    name = 'Test Club Sauna',
    description = 'Test shared reservation',
    malesDurationHours = 1,
    femalesDurationHours = 1,
    genderOrder = 'MALES_FIRST',
    participants = [],
  } = options;

  // Get the test club data
  const club = await prisma.club.findUnique({
    where: { secret: TEST_CLUB.secret },
    include: {
      islands: {
        include: {
          saunas: true,
        },
      },
      boats: true,
    },
  });

  if (!club) {
    throw new Error('Test club not found. Run resetTestClub() first.');
  }

  const saunas = club.islands.flatMap((i) => i.saunas);
  const sauna = saunas[saunaIndex];

  if (!sauna) {
    throw new Error('Invalid sauna index');
  }

  const now = new Date();
  const startTime = new Date(now.getTime() + startTimeOffset * 60 * 60 * 1000);
  const date = new Date(startTime);
  date.setHours(0, 0, 0, 0);

  const sharedReservation = await prisma.sharedReservation.create({
    data: {
      saunaId: sauna.id,
      date,
      startTime,
      malesDurationHours,
      femalesDurationHours,
      genderOrder,
      name,
      description,
      isAutoGenerated: false,
      createdBy: 'e2e_test',
    },
  });

  // Add participants
  for (const participant of participants) {
    const boat = club.boats[participant.boatIndex];
    if (!boat) {
      throw new Error(`Invalid boat index: ${participant.boatIndex}`);
    }

    await prisma.sharedReservationParticipant.create({
      data: {
        sharedReservationId: sharedReservation.id,
        boatId: boat.id,
        adults: participant.adults,
        kids: participant.kids,
      },
    });
  }

  return sharedReservation;
}

/**
 * Clean up: Disconnect Prisma client
 */
export async function disconnectPrisma() {
  await prisma.$disconnect();
}
