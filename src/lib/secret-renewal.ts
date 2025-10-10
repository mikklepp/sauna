import prisma from './db';
import { generateClubSecret } from './auth';

/**
 * Calculate the expiry date for a club secret
 * Always set to December 31st of the current year (or next year if we're in December)
 */
export function calculateSecretExpiry(): Date {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed (0 = January, 11 = December)

  // If we're in December, set expiry to next year's December 31st
  // Otherwise, set to current year's December 31st
  const expiryYear = currentMonth === 11 ? currentYear + 1 : currentYear;

  // December 31st at 23:59:59
  return new Date(expiryYear, 11, 31, 23, 59, 59, 999);
}

/**
 * Check if a club secret needs renewal
 * Returns true if secret expires within 30 days or is already expired
 */
export function needsRenewal(
  secretValidUntil: Date,
  now: Date = new Date()
): boolean {
  const daysUntilExpiry = Math.floor(
    (secretValidUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysUntilExpiry <= 30;
}

export interface RenewalResult {
  clubId: string;
  clubName: string;
  oldSecret: string;
  newSecret: string;
  oldExpiry: Date;
  newExpiry: Date;
  wasExpired: boolean;
}

/**
 * Renew club secrets that are expired or expiring soon (within 30 days)
 * Returns array of renewal results for logging/notification
 */
export async function renewClubSecrets(): Promise<RenewalResult[]> {
  const now = new Date();
  const renewalResults: RenewalResult[] = [];

  // Find all clubs that need renewal
  const clubs = await prisma.club.findMany({
    select: {
      id: true,
      name: true,
      secret: true,
      secretValidFrom: true,
      secretValidUntil: true,
    },
  });

  for (const club of clubs) {
    if (!needsRenewal(club.secretValidUntil, now)) {
      continue; // This club doesn't need renewal yet
    }

    const wasExpired = now > club.secretValidUntil;
    const newSecret = generateClubSecret();
    const newExpiry = calculateSecretExpiry();

    // Update club with new secret
    await prisma.club.update({
      where: { id: club.id },
      data: {
        secret: newSecret,
        secretValidFrom: now,
        secretValidUntil: newExpiry,
      },
    });

    renewalResults.push({
      clubId: club.id,
      clubName: club.name,
      oldSecret: club.secret,
      newSecret,
      oldExpiry: club.secretValidUntil,
      newExpiry,
      wasExpired,
    });

    // eslint-disable-next-line no-console
    console.log(
      `🔄 Renewed secret for club "${club.name}":\n` +
        `   Old secret: ${club.secret} (${wasExpired ? 'EXPIRED' : 'expiring soon'})\n` +
        `   New secret: ${newSecret}\n` +
        `   Valid until: ${newExpiry.toISOString()}`
    );
  }

  return renewalResults;
}

/**
 * Get clubs that need renewal (for reporting/monitoring)
 */
export async function getClubsNeedingRenewal(): Promise<
  Array<{
    id: string;
    name: string;
    secret: string;
    secretValidUntil: Date;
    daysUntilExpiry: number;
    isExpired: boolean;
  }>
> {
  const now = new Date();

  const clubs = await prisma.club.findMany({
    select: {
      id: true,
      name: true,
      secret: true,
      secretValidUntil: true,
    },
  });

  return clubs
    .filter((club) => needsRenewal(club.secretValidUntil, now))
    .map((club) => {
      const daysUntilExpiry = Math.floor(
        (club.secretValidUntil.getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24)
      );
      return {
        ...club,
        daysUntilExpiry,
        isExpired: now > club.secretValidUntil,
      };
    });
}
