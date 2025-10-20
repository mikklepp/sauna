import { PrismaClient } from '@prisma/client';
import { TEST_CLUB } from './test-fixtures';

/**
 * Clean up all reservations for today to ensure test isolation
 * This should be called in beforeEach hooks for tests that create reservations
 * Cleans up both individual reservations and shared reservations
 * ONLY deletes reservations belonging to the test club
 */
export async function cleanupTodaysReservations(): Promise<void> {
  const prisma = new PrismaClient();

  try {
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
  } finally {
    await prisma.$disconnect();
  }
}
