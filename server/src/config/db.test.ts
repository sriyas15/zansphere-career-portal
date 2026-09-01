import prisma from './db';
import { PrismaClient } from '@prisma/client';

describe('Database Config', () => {
  it('should export a prisma client instance', () => {
    expect(prisma).toBeDefined();
    expect(prisma).toBeInstanceOf(PrismaClient);
  });
});

