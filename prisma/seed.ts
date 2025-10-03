import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPasswordHash = await bcrypt.hash('admin123', 10);
  const admin = await prisma.adminUser.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: adminPasswordHash,
      name: 'System Administrator',
      email: 'admin@saunareservations.com',
    },
  });
  console.log('✅ Created admin user:', admin.username);

  // Create club
  const clubSecret = 'DEMO2024SECRET';
  const club = await prisma.club.upsert({
    where: { secret: clubSecret },
    update: {},
    create: {
      name: 'Helsinki Sailing Club',
      secret: clubSecret,
      secretValidFrom: new Date('2024-01-01'),
      secretValidUntil: new Date('2024-12-31'),
      logoUrl: null,
      primaryColor: '#0070f3',
      secondaryColor: '#7928ca',
      timezone: 'Europe/Helsinki',
    },
  });
  console.log('✅ Created club:', club.name);

  // Create islands
  const island1 = await prisma.island.create({
    data: {
      clubId: club.id,
      name: 'Saaristo Island',
      numberOfSaunas: 2,
    },
  });

  const island2 = await prisma.island.create({
    data: {
      clubId: club.id,
      name: 'Harmaja Island',
      numberOfSaunas: 1,
    },
  });
  console.log('✅ Created islands:', island1.name, island2.name);

  // Create saunas for Island 1
  const sauna1 = await prisma.sauna.create({
    data: {
      islandId: island1.id,
      name: 'Main Sauna',
      heatingTimeHours: 2,
      autoClubSaunaEnabled: true,
    },
  });

  const sauna2 = await prisma.sauna.create({
    data: {
      islandId: island1.id,
      name: 'Small Sauna',
      heatingTimeHours: 1,
      autoClubSaunaEnabled: false,
    },
  });

  // Create sauna for Island 2
  const sauna3 = await prisma.sauna.create({
    data: {
      islandId: island2.id,
      name: 'Beach Sauna',
      heatingTimeHours: 3,
      autoClubSaunaEnabled: true,
    },
  });
  console.log('✅ Created saunas:', sauna1.name, sauna2.name, sauna3.name);

  // Create boats
  const boats = [
    {
      name: 'Sea Spirit',
      membershipNumber: 'HSC-001',
      captainName: 'Matti Virtanen',
      phoneNumber: '+358 40 123 4567',
    },
    {
      name: 'Wave Dancer',
      membershipNumber: 'HSC-002',
      captainName: 'Liisa Korhonen',
      phoneNumber: '+358 50 234 5678',
    },
    {
      name: 'Wind Song',
      membershipNumber: 'HSC-003',
      captainName: 'Pekka Nieminen',
      phoneNumber: null,
    },
    {
      name: 'Sunset Dream',
      membershipNumber: 'HSC-004',
      captainName: 'Anna Mäkelä',
      phoneNumber: '+358 40 345 6789',
    },
    {
      name: 'Blue Horizon',
      membershipNumber: 'HSC-005',
      captainName: 'Jari Salminen',
      phoneNumber: '+358 45 456 7890',
    },
    {
      name: 'Ocean Breeze',
      membershipNumber: 'HSC-006',
      captainName: 'Kaisa Lahtinen',
      phoneNumber: null,
    },
    {
      name: 'Nordic Star',
      membershipNumber: 'HSC-007',
      captainName: 'Mikko Hämäläinen',
      phoneNumber: '+358 40 567 8901',
    },
    {
      name: 'Baltic Pearl',
      membershipNumber: 'HSC-008',
      captainName: 'Sari Virtanen',
      phoneNumber: '+358 50 678 9012',
    },
    {
      name: 'Midnight Sun',
      membershipNumber: 'HSC-009',
      captainName: 'Timo Järvinen',
      phoneNumber: null,
    },
    {
      name: 'Silver Wave',
      membershipNumber: 'HSC-010',
      captainName: 'Laura Rantanen',
      phoneNumber: '+358 40 789 0123',
    },
  ];

  for (const boatData of boats) {
    await prisma.boat.create({
      data: {
        ...boatData,
        clubId: club.id,
      },
    });
  }
  console.log('✅ Created', boats.length, 'boats');

  // Create some sample reservations (today and tomorrow)
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Get boat IDs
  const boatList = await prisma.boat.findMany({
    where: { clubId: club.id },
    take: 5,
  });

  // Today's reservations
  const todayStart = new Date(today);
  todayStart.setHours(14, 0, 0, 0);
  
  await prisma.reservation.create({
    data: {
      saunaId: sauna1.id,
      boatId: boatList[0].id,
      startTime: todayStart,
      endTime: new Date(todayStart.getTime() + 60 * 60 * 1000),
      adults: 4,
      kids: 2,
      status: 'ACTIVE',
    },
  });

  const todayStart2 = new Date(today);
  todayStart2.setHours(16, 0, 0, 0);
  
  await prisma.reservation.create({
    data: {
      saunaId: sauna1.id,
      boatId: boatList[1].id,
      startTime: todayStart2,
      endTime: new Date(todayStart2.getTime() + 60 * 60 * 1000),
      adults: 2,
      kids: 0,
      status: 'ACTIVE',
    },
  });

  console.log('✅ Created sample reservations');

  // Create a sample shared reservation for tomorrow
  const tomorrowStart = new Date(tomorrow);
  tomorrowStart.setHours(21, 0, 0, 0);

  const sharedReservation = await prisma.sharedReservation.create({
    data: {
      saunaId: sauna1.id,
      date: tomorrow,
      startTime: tomorrowStart,
      malesDurationHours: 1,
      femalesDurationHours: 1,
      genderOrder: 'FEMALES_FIRST',
      name: 'Weekend Social Sauna',
      description: 'Join us for a relaxing evening!',
      isAutoGenerated: false,
      createdBy: 'admin',
    },
  });

  // Add participants to shared reservation
  await prisma.sharedReservationParticipant.create({
    data: {
      sharedReservationId: sharedReservation.id,
      boatId: boatList[2].id,
      adults: 3,
      kids: 1,
    },
  });

  await prisma.sharedReservationParticipant.create({
    data: {
      sharedReservationId: sharedReservation.id,
      boatId: boatList[3].id,
      adults: 2,
      kids: 0,
    },
  });

  console.log('✅ Created shared reservation with participants');

  console.log('');
  console.log('🎉 Seed completed successfully!');
  console.log('');
  console.log('📝 Test credentials:');
  console.log('   Admin: username=admin, password=admin123');
  console.log('   Club Secret:', clubSecret);
  console.log('');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });