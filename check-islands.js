const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const club = await prisma.club.findFirst();
  if (!club) {
    console.log('No club found');
    process.exit(1);
  }

  const islands = await prisma.island.findMany({
    where: { clubId: club.id },
    include: {
      _count: {
        select: {
          saunas: true
        }
      },
      saunas: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  console.log('Islands for club', club.name + ':');
  console.log(JSON.stringify(islands.slice(0, 3), null, 2));

  await prisma.$disconnect();
})();
