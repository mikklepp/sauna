import { PrismaClient } from '@prisma/client';

let cachedClubSecret: string | null = null;
let setupPromise: Promise<string> | null = null;

/**
 * Get or create a valid club secret for testing
 * This is cached to avoid race conditions when tests run in parallel
 */
export async function getValidClubSecret(): Promise<string> {
  // If we already have a cached secret, return it
  if (cachedClubSecret) {
    return cachedClubSecret;
  }

  // If setup is in progress, wait for it
  if (setupPromise) {
    return setupPromise;
  }

  // Start setup
  setupPromise = setupClubSecret();
  cachedClubSecret = await setupPromise;
  setupPromise = null;

  return cachedClubSecret;
}

async function setupClubSecret(): Promise<string> {
  const prisma = new PrismaClient();

  try {
    const clubs = await prisma.club.findMany({ take: 1 });

    if (clubs.length === 0) {
      throw new Error('No clubs available in database');
    }

    // Update club secret to be valid
    const validFrom = new Date();
    validFrom.setDate(validFrom.getDate() - 1);

    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + 30);

    const testSecret = `TEST${Date.now()}`.substring(0, 16).toUpperCase();

    await prisma.club.update({
      where: { id: clubs[0].id },
      data: {
        secret: testSecret,
        secretValidFrom: validFrom,
        secretValidUntil: validUntil,
      },
    });

    console.log('Set up club secret:', testSecret);
    return testSecret;
  } finally {
    await prisma.$disconnect();
  }
}
