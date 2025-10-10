/**
 * Manual Club Secret Renewal Script
 *
 * Run this script to immediately renew expired or expiring club secrets:
 * npx tsx scripts/renew-secrets.ts
 */

import { PrismaClient } from '@prisma/client';
import {
  renewClubSecrets,
  getClubsNeedingRenewal,
} from '../src/lib/secret-renewal';

const prisma = new PrismaClient();

async function main() {
  console.log('\n' + '='.repeat(80));
  console.log('🔐 CLUB SECRET RENEWAL TOOL');
  console.log('='.repeat(80) + '\n');

  // Check what needs renewal
  const needingRenewal = await getClubsNeedingRenewal();

  if (needingRenewal.length === 0) {
    console.log('✅ No club secrets need renewal at this time.\n');
    console.log('All club secrets are valid for at least 30 more days.\n');
    return;
  }

  console.log(`Found ${needingRenewal.length} club(s) needing renewal:\n`);

  for (const club of needingRenewal) {
    const status = club.isExpired ? '❌ EXPIRED' : '⚠️  EXPIRING SOON';
    console.log(
      `  ${status} - ${club.name}\n` +
        `    Current secret: ${club.secret}\n` +
        `    Expires: ${club.secretValidUntil.toISOString()}\n` +
        `    Days until expiry: ${club.daysUntilExpiry}\n`
    );
  }

  console.log('Starting renewal process...\n');

  // Perform renewal
  const results = await renewClubSecrets();

  console.log('\n' + '='.repeat(80));
  console.log('✅ RENEWAL COMPLETE');
  console.log('='.repeat(80) + '\n');

  console.log(`Successfully renewed ${results.length} club secret(s):\n`);

  for (const result of results) {
    console.log(
      `📋 ${result.clubName}\n` +
        `   Old secret: ${result.oldSecret} ${result.wasExpired ? '(EXPIRED)' : '(expiring soon)'}\n` +
        `   New secret: ${result.newSecret}\n` +
        `   Old expiry: ${result.oldExpiry.toISOString()}\n` +
        `   New expiry: ${result.newExpiry.toISOString()}\n`
    );
  }

  console.log('='.repeat(80));
  console.log(
    '\n⚠️  IMPORTANT: Distribute new secrets to club administrators!\n'
  );
  console.log(
    'The new secrets above must be communicated to club admins so they can\n' +
      'update their QR codes and authentication systems.\n'
  );
}

main()
  .catch((error) => {
    console.error('\n❌ Error during renewal:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
