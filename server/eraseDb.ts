import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('⚠️ Starting Career Portal database wipe...');
  console.log('This will ONLY delete data from portal_* tables. Zanpeople candidates will NOT be affected.');

  try {
    // We delete in reverse order of dependencies to avoid foreign key constraint errors
    
    // 1. Delete employment history
    const historyResult = await prisma.employmentHistoryEntry.deleteMany({});
    console.log(`✅ Deleted ${historyResult.count} employment history entries.`);

    // 2. Delete applications
    const appsResult = await prisma.portalApplication.deleteMany({});
    console.log(`✅ Deleted ${appsResult.count} applications.`);

    // 3. Delete OTPs
    const otpsResult = await prisma.otp.deleteMany({});
    console.log(`✅ Deleted ${otpsResult.count} OTP records.`);

    // 4. Delete users
    const usersResult = await prisma.portalUser.deleteMany({});
    console.log(`✅ Deleted ${usersResult.count} portal users.`);

    console.log('🎉 Career Portal database wipe completed successfully.');
  } catch (error) {
    console.error('❌ Error wiping database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
