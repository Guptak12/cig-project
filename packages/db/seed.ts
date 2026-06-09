import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_NAME  = 'Super Admin';
const ADMIN_PLAIN_PASSWORD = 'ChangeMeNow!';

async function main() {
  const passwordHash = await bcrypt.hash(ADMIN_PLAIN_PASSWORD, 10);
  await prisma.user.upsert({
    where: { email: ADMIN_EMAIL },
    update: { isApproved: true, passwordHash, role: Role.ADMIN, name: ADMIN_NAME },
    create: {
      email: ADMIN_EMAIL,
      name: ADMIN_NAME,
      passwordHash,
      role: Role.ADMIN,
      isApproved: true,
    },
  });
  console.log('✅ Admin user seeded (or already exists).');
}

main()
  .catch(e => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
