/**
 * Seed script — creates a demo club, event, and admin user.
 * Run with: npx tsx seed.ts
 * Requires DATABASE_URL to be set.
 */
import 'dotenv/config';
import { prisma } from './src/index.js';
import bcrypt from 'bcryptjs';

async function seed() {
  console.log('[seed] Starting...');

  // 1. Create admin user
  const passwordHash = await bcrypt.hash('admin1234', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@cig.dev' },
    update: {},
    create: {
      name: 'CIG Admin',
      email: 'admin@cig.dev',
      passwordHash,
      role: 'ADMIN',
    },
  });
  console.log('[seed] Admin user:', admin.email);

  // 2. Create photographer
  const photoHash = await bcrypt.hash('photo1234', 12);
  const photographer = await prisma.user.upsert({
    where: { email: 'photo@cig.dev' },
    update: {},
    create: {
      name: 'Demo Photographer',
      email: 'photo@cig.dev',
      passwordHash: photoHash,
      role: 'PHOTOGRAPHER',
    },
  });
  console.log('[seed] Photographer:', photographer.email);

  // 3. Create club
  const club = await prisma.club.upsert({
    where: { id: 'clb-demo' },
    update: {},
    create: {
      id: 'clb-demo',
      name: 'Photography Club',
    },
  });
  console.log('[seed] Club:', club.name);

  // 4. Create events
  const events = [
    { name: 'Annual Photography Walk 2025', description: 'City photography expedition', date: new Date('2025-03-15') },
    { name: 'Cultural Fest — Spring Edition', description: 'Annual spring cultural festival', date: new Date('2025-04-20') },
    { name: 'Freshers Welcome Night 2025', description: 'Welcome party for new members', date: new Date('2025-08-10') },
  ];

  for (const ev of events) {
    const event = await prisma.event.create({
      data: { ...ev, clubId: club.id, isPublic: true },
    });

    // Create a default album for each event
    await prisma.album.create({
      data: { name: 'Main Album', eventId: event.id, isPublic: true },
    });

    console.log('[seed] Event:', event.name);
  }

  console.log('[seed] Done! ✓');
  console.log('[seed] Admin login: admin@cig.dev / admin1234');
  console.log('[seed] Photographer login: photo@cig.dev / photo1234');
}

seed()
  .catch((err) => { console.error('[seed] Error:', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
