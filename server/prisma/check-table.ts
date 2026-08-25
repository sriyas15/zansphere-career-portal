import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function check() {
  try {
    const result = await prisma.$queryRawUnsafe('SELECT count(*) as cnt FROM portal_users');
    console.log('✅ portal_users table EXISTS! Row count:', result);
  } catch (e: any) {
    console.error('❌ Table check FAILED:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

check();
