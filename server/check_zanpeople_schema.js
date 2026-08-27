const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const result = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'job_openings';
  `);
  console.log(JSON.stringify(result, null, 2));
  await prisma.$disconnect();
}
check();
