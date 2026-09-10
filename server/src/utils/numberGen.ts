import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function generateLiquidNumber() {
  while (true) {
    const num = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const exists = await prisma.user.findUnique({ where: { liquidNumber: num } });
    if (!exists) return num;
  }
}

