import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function deleteSafely(modelDelegate: any, name: string) {
  try {
    const result = await modelDelegate.deleteMany({});
    console.log(`✅ Deleted ${result.count} ${name}.`);
  } catch (error: any) {
    if (error.code === 'P2021') {
      console.log(`⚠️ Skipped ${name}: Table does not exist yet.`);
    } else {
      throw error;
    }
  }
}

async function main() {
  console.log('⚠️ Starting Career Portal database wipe...');
  console.log('This will ONLY delete data from portal_* tables. Zanpeople candidates will NOT be affected.');

  try {
    // We delete in reverse order of dependencies to avoid foreign key constraint errors

    // 1. Delete employment history
    await deleteSafely(prisma.employmentHistoryEntry, 'employment history entries');

    // 2. Delete applications
    await deleteSafely(prisma.portalProfile, 'Portal Profiles');

    // 3. Delete OTPs
    await deleteSafely(prisma.otp, 'OTP records');

    // 4. Delete users
    await deleteSafely(prisma.portalUser, 'portal users');

    console.log('🎉 Career Portal database wipe completed successfully.');
  } catch (error) {
    console.error('❌ Error wiping database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
