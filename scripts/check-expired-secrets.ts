import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkExpiredSecrets() {
  const now = new Date();

  const allClubs = await prisma.club.findMany({
    select: {
      id: true,
      name: true,
      secret: true,
      secretValidFrom: true,
      secretValidUntil: true,
    },
  });

  console.log(`\n📊 Club Secret Status Report (${now.toISOString()})\n`);
  console.log('='.repeat(80));

  const expired = [];
  const valid = [];
  const upcoming = [];

  for (const club of allClubs) {
    const daysUntilExpiry = Math.floor(
      (club.secretValidUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (now > club.secretValidUntil) {
      expired.push({ ...club, daysUntilExpiry });
    } else if (daysUntilExpiry <= 30) {
      upcoming.push({ ...club, daysUntilExpiry });
    } else {
      valid.push({ ...club, daysUntilExpiry });
    }
  }

  if (expired.length > 0) {
    console.log(`\n❌ EXPIRED (${expired.length} clubs):`);
    for (const club of expired) {
      console.log(
        `  - ${club.name}: Expired ${Math.abs(club.daysUntilExpiry)} days ago`
      );
      console.log(`    Valid until: ${club.secretValidUntil.toISOString()}`);
    }
  }

  if (upcoming.length > 0) {
    console.log(`\n⚠️  EXPIRING SOON (${upcoming.length} clubs):`);
    for (const club of upcoming) {
      console.log(`  - ${club.name}: Expires in ${club.daysUntilExpiry} days`);
      console.log(`    Valid until: ${club.secretValidUntil.toISOString()}`);
    }
  }

  if (valid.length > 0) {
    console.log(`\n✅ VALID (${valid.length} clubs):`);
    for (const club of valid) {
      console.log(`  - ${club.name}: Expires in ${club.daysUntilExpiry} days`);
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(
    `\nTotal: ${allClubs.length} clubs | Expired: ${expired.length} | Expiring soon: ${upcoming.length} | Valid: ${valid.length}\n`
  );

  await prisma.$disconnect();
}

checkExpiredSecrets().catch(console.error);
