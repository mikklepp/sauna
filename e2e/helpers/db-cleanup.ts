import prisma from '../../src/lib/db';
import { TEST_CLUB, TEST_ISLANDS } from './test-fixtures';

/**
 * Clean up test-created islands and saunas from admin tests
 * Removes islands/saunas with test naming patterns that aren't part of baseline fixtures
 * Call this in afterEach for admin tests
 */
export async function cleanupAdminTestData(): Promise<void> {
  const club = await prisma.club.findUnique({
    where: { secret: TEST_CLUB.secret },
    include: {
      islands: {
        include: {
          saunas: true,
        },
      },
    },
  });

  if (!club) {
    return;
  }

  // Get baseline island names from fixtures
  const baselineIslandNames: string[] = TEST_ISLANDS.map(
    (island) => island.name
  );

  // Find test-created islands (not in baseline)
  const testIslands = club.islands.filter(
    (island) => !baselineIslandNames.includes(island.name)
  );

  // Delete test islands (cascade will delete saunas and reservations)
  for (const island of testIslands) {
    await prisma.island.delete({
      where: { id: island.id },
    });
  }

  // Also clean up test saunas on baseline islands
  // (e.g., "Test Sauna ${timestamp}" created on existing islands during tests)
  const baselineIslands = club.islands.filter((island) =>
    baselineIslandNames.includes(island.name)
  );

  for (const island of baselineIslands) {
    // Delete any saunas with test naming patterns
    const testSaunas = island.saunas.filter(
      (sauna) =>
        sauna.name.startsWith('Test Sauna ') ||
        (sauna.name.startsWith('Beach Sauna') &&
          !sauna.name.match(/^(North|South)\s+(Main|Small|Beach)\s+Sauna$/))
    );

    for (const sauna of testSaunas) {
      await prisma.sauna.delete({
        where: { id: sauna.id },
      });
    }
  }
}

/**
 * Clean up all reservations for today to ensure test isolation
 * This should be called in beforeEach hooks for tests that create reservations
 * Cleans up both individual reservations and shared reservations
 * ONLY deletes reservations belonging to the test club
 *
 * Uses shared Prisma instance to avoid exhausting database connections
 */
export async function cleanupTodaysReservations(): Promise<void> {
  // Find the test club
  const club = await prisma.club.findUnique({
    where: { secret: TEST_CLUB.secret },
    include: { islands: { include: { saunas: true } } },
  });

  if (!club) {
    // Test club doesn't exist yet, nothing to clean up
    return;
  }

  // Get all sauna IDs belonging to the test club
  const saunaIds = club.islands.flatMap((island) =>
    island.saunas.map((sauna) => sauna.id)
  );

  if (saunaIds.length === 0) {
    return;
  }

  // Delete today's test reservations
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Clean up shared reservations first (due to foreign key constraints)
  await prisma.sharedReservation.deleteMany({
    where: {
      saunaId: { in: saunaIds },
      startTime: {
        gte: today,
      },
    },
  });

  // Clean up individual reservations
  await prisma.reservation.deleteMany({
    where: {
      saunaId: { in: saunaIds },
      startTime: {
        gte: today,
      },
    },
  });
}
