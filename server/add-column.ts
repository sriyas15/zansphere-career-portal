import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  try {
    await prisma.$executeRawUnsafe('ALTER TABLE portal_applications ADD COLUMN IF NOT EXISTS pan_number VARCHAR(10);');
    console.log('Column added successfully.');
  } catch (e) {
    console.error('Error adding column:', e);
  } finally {
    await prisma.$disconnect();
  }
}
main();
