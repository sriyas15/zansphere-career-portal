import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Running raw SQL to alter portal_applications safely...');
  
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "portal_applications" DROP CONSTRAINT IF EXISTS "portal_applications_userId_jobId_key";`);
    console.log('Dropped unique constraint.');
  } catch (e) { console.error(e); }

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "portal_applications" DROP COLUMN IF EXISTS "job_id";`);
    console.log('Dropped job_id column.');
  } catch (e) { console.error(e); }

  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE "portal_applications" ADD COLUMN IF NOT EXISTS "role_of_interest" VARCHAR(100);`);
    console.log('Added role_of_interest column.');
  } catch (e) { console.error(e); }

  console.log('Done.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
